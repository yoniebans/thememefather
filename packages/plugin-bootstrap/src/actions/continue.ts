import { composeContext, elizaLogger } from "@ai16z/eliza";
import { generateMessageResponse, generateTrueOrFalse } from "@ai16z/eliza";
import {
    booleanFooter,
    messageCompletionFooter,
    formatMessages,
} from "@ai16z/eliza";
import {
    Action,
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";

const maxContinuesInARow = 3;

export const messageHandlerTemplate =
    // {{goals}}
    `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}
{{knowledge}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export const shouldContinueTemplate =
    `# Task: Analyze if {{agentName}} should continue the conversation

# Semantic Completion Check
A message needs continuation if ANY of these are true:
1. It introduces a new topic or idea without elaborating (e.g. "I've got a new strategy" without explaining the strategy)
2. It makes a statement that naturally requires follow-up (e.g. "Let me tell you what happened")
3. It starts explaining something but doesn't complete the explanation

A message is complete and should NOT continue if ANY of these are true:
1. It ends with a question (even if followed by emojis or decorative elements)
2. It asks for user input or engagement
3. It makes a complete statement that doesn't promise more information
4. It's a greeting or acknowledgment
5. The user's last message was a greeting or simple acknowledgment

# Last Exchange:
{{lastInteraction}}

# Response Format
Analyze the last exchange and respond with YES or NO:
- YES if {{agentName}} should continue their last message
- NO if the thought is complete or user engagement is needed
 ` + booleanFooter;

export const continueAction: Action = {
    name: "CONTINUE",
    similes: ["ELABORATE", "KEEP_TALKING"],
    description: `ONLY use this action in scenarios where the current message explicitly sets up a need for immediate follow-up information, such as:
1. Starting to explain a specific strategy ("Let me break down this chart pattern...")
2. Beginning to reveal information ("I've noticed something interesting about recent market movements...")
3. Setting up a multi-part explanation ("First, we need to look at the memetic indicators...")
4. Starting to outline a specific plan ("Here's how we're going to play this moonshot...")

DO NOT use if the message:
- Asks for user input
- Ends with a question
- Makes a complete statement
- Offers choices/options
- Is a greeting or acknowledgment
- Invites user engagement in any way
`,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const recentMessagesData = await runtime.messageManager.getMemories({
            roomId: message.roomId,
            count: 10,
            unique: false,
        });
        const agentMessages = recentMessagesData.filter(
            (m: { userId: any }) => m.userId === runtime.agentId
        );

        // check if the last messages were all continues=
        if (agentMessages) {
            const lastMessages = agentMessages.slice(0, maxContinuesInARow);
            if (lastMessages.length >= maxContinuesInARow) {
                const allContinues = lastMessages.every(
                    (m: { content: any }) =>
                        (m.content as Content).action === "CONTINUE"
                );
                if (allContinues) {
                    return false;
                }
            }
        }

        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Executing CONTINUE action");
        if (
            message.content.text.endsWith("?") ||
            message.content.text.endsWith("!")
        ) {
            return;
        }

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        }

        state = await runtime.updateRecentMessageState(state);

        async function _shouldContinue(state: State): Promise<boolean> {
            try {
                const recentMessagesData = state.recentMessagesData;
                if (!recentMessagesData || recentMessagesData.length === 0) {
                    return false;
                }

                // Get the last message and its sender
                const lastMessage = recentMessagesData[0];
                const lastSenderId = lastMessage.userId;

                // Collect messages of interest
                const messagesOfInterest = [];
                for (const message of recentMessagesData) {
                    if (message.userId === lastSenderId) {
                        messagesOfInterest.push(message);
                        if (messagesOfInterest.length === 3) {
                            break;
                        }
                    } else {
                        messagesOfInterest.push(message);
                        break;
                    }
                }

                // Format just the messages we're interested in
                state.lastInteraction = formatMessages({
                    messages: messagesOfInterest,
                    actors: state.actorsData,
                });

                elizaLogger.log("Last Interaction:", state.lastInteraction);

                const shouldRespondContext = composeContext({
                    state,
                    template: shouldContinueTemplate,
                });

                return await generateTrueOrFalse({
                    context: shouldRespondContext,
                    modelClass: ModelClass.SMALL,
                    runtime,
                });
            } catch (error) {
                elizaLogger.error("Error in _shouldContinue function:", error);
                return false;
            }
        }

        const shouldContinue = await _shouldContinue(state);
        if (!shouldContinue) {
            elizaLogger.log("Not elaborating, returning");
            return;
        }

        const context = composeContext({
            state,
            template:
                runtime.character.templates?.continueMessageHandlerTemplate ||
                runtime.character.templates?.messageHandlerTemplate ||
                messageHandlerTemplate,
        });
        const { userId, roomId } = message;

        const response = await generateMessageResponse({
            runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        response.inReplyTo = message.id;

        runtime.databaseAdapter.log({
            body: { message, context, response },
            userId,
            roomId,
            type: "continue",
        });

        // prevent repetition
        const messageExists = state.recentMessagesData
            .filter((m: { userId: any }) => m.userId === runtime.agentId)
            .slice(0, maxContinuesInARow + 1)
            .some((m: { content: any }) => m.content === message.content);

        if (messageExists) {
            return;
        }

        await callback(response);

        // if the action is CONTINUE, check if we are over maxContinuesInARow
        if (response.action === "CONTINUE") {
            const agentMessages = state.recentMessagesData
                .filter((m: { userId: any }) => m.userId === runtime.agentId)
                .map((m: { content: any }) => (m.content as Content).action);

            const lastMessages = agentMessages.slice(0, maxContinuesInARow);
            if (lastMessages.length >= maxContinuesInARow) {
                const allContinues = lastMessages.every(
                    (m: string | undefined) => m === "CONTINUE"
                );
                if (allContinues) {
                    response.action = null;
                }
            }
        }

        return response;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "bro these charts looking weird af" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me tell you what I'm seeing in these patterns. The rare pepe index is showing some interesting divergence...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "When meme volume spikes like this while sentiment stays low, it's historically been a sign of smart money accumulating",
                    action: "NONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "thinking about launching a memecoin" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Ah, you want to learn the ancient art of tokenomics. Let me share the sacred knowledge passed down through generations of degens...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The first rule of memetic token design is understanding your target community. The token must resonate with their collective consciousness",
                    action: "NONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "need to understand what happened with that rugpull yesterday",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've been analyzing the on-chain data, and I'm seeing a pattern that's all too familiar. The signs were there...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The wallet movements 48 hours before showed classic whale manipulation. Always watch the big holders",
                    action: "NONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "why do my trades always get front-run?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me share a time-tested strategy from the family's playbook to avoid these MEV bots. First, we need to understand how they operate...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "They look for specific patterns in the mempool, so timing and size are everything in dodging them",
                    action: "NONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "explain to me what makes a good meme coin" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The art of crafting a successful meme coin is like cooking the perfect pasta. Let me break down the essential ingredients...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "A strong community, unique tokenomics, and perfect timing - these are the base elements that set up a moonshot",
                    action: "NONE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "yo what's causing this pump?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've been monitoring the telegram groups and checking my network of anon informants. A pattern is emerging...",
                    action: "CONTINUE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Three major whales have been accumulating quietly. They're known for having good timing",
                    action: "NONE",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
