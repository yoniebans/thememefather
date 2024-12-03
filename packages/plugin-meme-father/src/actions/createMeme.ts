import { Action, IAgentRuntime, Memory, State, composeContext, generateText, ModelClass, elizaLogger } from '@ai16z/eliza';

/**
 * Template for generating meme details in the agent's voice.
 * Uses context to generate appropriate ticker and description.
 */
const memePromptTemplate = `
About {{agentName}}:
{{bio}}
{{lore}}

{{recentMessages}}

# Task: Create a meme token based on the conversation
Analyze the conversation and create a meme token with the following format:
* TICKER: A short, memorable ticker symbol (3-5 characters)
* DESCRIPTION: A concise, witty description of the meme (max 140 characters)
* CATEGORY: The type of meme (e.g., CRYPTO, TECH, CULTURE, POLITICS)

Format the response as a JSON object with these fields. Keep it brief and meme-worthy.`;

// Add this interface before the createMemeAction
interface MemeDetails {
    TICKER: string;
    DESCRIPTION: string;
    CATEGORY: string;
}

export const createMemeAction: Action = {
    name: "CREATE_MEME",
    similes: [
        "SAVE_MEME",
        "MEME_THIS",
        "MAKE_MEME",
        "RECORD_MEME"
    ],
    description: "Save a meme-worthy conversation or idea to the meme leaderboard",
    validate: async () => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: (content: { text: string; error?: boolean }) => void
    ) => {
        const memeManager = runtime.getMemoryManager('memes');
        if (!memeManager) {
            callback({ text: "Failed to create meme: Meme manager not found", error: true });
            return;
        }

        // Generate meme details using the template and context
        const memeContext = composeContext({
            state,
            template: memePromptTemplate,
        });

        // Generate the meme details
        const memeDetails = await generateText({
            runtime,
            context: memeContext,
            modelClass: ModelClass.SMALL,
        });

        // Parse the generated meme details
        let parsedMemeDetails;
        try {
            // Remove markdown code blocks and extract just the JSON
            const jsonString = memeDetails
                .replace(/```json\n?/, '')  // Remove opening ```json
                .replace(/```\n?/, '')      // Remove closing ```
                .trim();                    // Remove any extra whitespace

            parsedMemeDetails = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse meme details:', e);
            console.log('Raw meme details:', memeDetails);
            callback({ text: "Failed to parse meme details", error: true });
            return;
        }


        // // Create a copy of the memory object
        // const memoryWithoutEmbedding = { ...message };

        // // Delete the embedding field if it exists
        // delete memoryWithoutEmbedding.embedding;

        // elizaLogger.info('message', JSON.stringify(memoryWithoutEmbedding, null, 2));


        // const stringifyWithoutEmbeddings = (obj: any): string => {
        //     return JSON.stringify(obj, (key, value) => {
        //         // If this is a Memory object (checking for typical Memory properties)
        //         if (value && typeof value === 'object' && 'content' in value && 'userId' in value) {
        //             // Skip Memory objects entirely
        //             return undefined;
        //         }
        //         return value;
        //     }, 2);
        // };

        // elizaLogger.info('state', stringifyWithoutEmbeddings(state));

        const memeMemory: Memory = {
            id: crypto.randomUUID(),
            content: {
                text: `Meme Ticker: ${parsedMemeDetails.TICKER} - ${parsedMemeDetails.DESCRIPTION}`,
                ticker: parsedMemeDetails.TICKER,
                description: parsedMemeDetails.DESCRIPTION,
                category: parsedMemeDetails.CATEGORY,
                votes: 0,
                status: 'pending'
            },
            userId: message.userId,
            roomId: runtime.agentId,
            agentId: runtime.agentId,
            createdAt: Date.now()
        };

        await memeManager.createMemory(memeMemory, true);

        return {
            text: "That's hilarious! I've saved it as a meme. The community can vote on it in the leaderboard! 🎯",
            action: "CREATE_MEME"
        };
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Web3 devs be like: I don't always test my code, but when I do, I do it in production" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "😂 That's gold! I'm adding that to our meme collection - 'Web3 devs and their production testing adventures' 🚀",
                    action: "CREATE_MEME"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "My portfolio is like a rollercoaster, except it only goes down" }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "That's too relatable! Adding it to the meme board - 'The only down-only rollercoaster: My crypto portfolio' 📉😅",
                    action: "CREATE_MEME"
                }
            }
        ]
    ]
};