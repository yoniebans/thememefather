import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    composeContext,
    generateImage,
    ModelClass,
    elizaLogger,
    generateObject,
    formatMessages,
    HandlerCallback,
    Content,
    Media,
} from "@ai16z/eliza";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Template for generating meme details in the agent's voice.
 * Uses context to generate appropriate ticker and description.
 */
const memePromptTemplate = `
Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "name": "the meme father",
    "ticker": "FMLY",
    "description": "digital don of the memetic realm | running the largest degen family in crypto | bull run architect | fort knox of meme liquidity | vires in memeris 🤌",
    "image_description": "a Pepe frog wearing a black fur coat jacket, diamond chain and bracelet, standing in front of a Lambo dealership."
}
\`\`\`

{{last10Messages}}

Given the recent messages, extract or generate (come up with if not included) the following information about the requested token creation:
- Token name
- Token ticker
- Token description
- Token image description

Respond with a JSON markdown block containing only the extracted values.`;

const imagePromptTemplate = `
ticker: {{ticker}}, {{image_description}}`;

const shouldCreateMemeTemplate = `
Respond with a JSON markdown block containing only the following values:
- approved: boolean indicating if the meme concept should be created
- reason: string explaining why (for both approvals and rejections)

Example responses:
\`\`\`json
{
    "approved": false,
    "reason": "[TOO_SIMILAR] Concept overlaps with pending meme 'The Hodl Monk' which already captures meditation through volatility"
}
\`\`\`

\`\`\`json
{
    "approved": true,
    "reason": "Novel perspective on MEV with clear visual potential and cultural resonance, distinct from existing memes"
}
\`\`\`

# Recent Pending Memes
{{pendingMemes}}

# New Meme
ticker: {{meme_ticker}}
description: {{meme_description}}
name: {{meme_name}}

# Evaluation Criteria
1. Novelty Check:
- Is this concept substantially different from existing pending memes?
- Does it introduce a new perspective or insight?

2. Cultural Relevance:
- Does it capture a deep truth about crypto/web3 culture?
- Is the symbolism relatable to the target audience?

3. Visual Potential:
- Can it be represented in a clear, distinctive way?
- Would it be immediately recognizable?

4. Virality Factors:
- Does it have emotional resonance?
- Is it easily shareable and understandable?

Analyze the proposed meme concept against the above criteria and respond with a JSON markdown block containing the approval status and reason.`;

export function saveBase64Image(base64Data: string, filename: string): string {
    // Create generatedImages directory if it doesn't exist
    const imageDir = path.join(process.cwd(), "generatedImages");
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // Remove the data:image/png;base64 prefix if it exists
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Create a buffer from the base64 string
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Create full file path
    const filepath = path.join(imageDir, `${filename}.png`);

    // Save the file
    fs.writeFileSync(filepath, imageBuffer);

    return filepath;
}

export async function saveHeuristImage(
    imageUrl: string,
    filename: string
): Promise<string> {
    const imageDir = path.join(process.cwd(), "generatedImages");
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Create full file path
    const filepath = path.join(imageDir, `${filename}.png`);

    // Save the file
    fs.writeFileSync(filepath, imageBuffer);

    return filepath;
}

export const createMemeAction: Action = {
    name: "CREATE_MEME",
    similes: ["SAVE_MEME", "MEME_THIS", "MAKE_MEME", "RECORD_MEME"],
    description:
        "Save groundbreaking meme concepts that pass novelty and quality validation checks. Each meme must bring something new to the crypto zeitgeist - no recycled concepts or basic observations. Make sure the conversation has reached a point where it's clear that the next step is to create a meme. Use sparingly.",
    validate: async () => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        const memeManager = runtime.getMemoryManager("memes");
        if (!memeManager) {
            callback({
                text: "Failed to create meme: Meme manager not found",
                error: true,
            });
            return;
        }

        // Just take the last 10 messages
        const messagesOfInterest = state.recentMessagesData.slice(-9);

        messagesOfInterest.push(message);
        messagesOfInterest.reverse();

        // Format just the messages we're interested in
        state.last10Messages = formatMessages({
            messages: messagesOfInterest,
            actors: state.actorsData,
        });

        // Generate meme details using the template and context
        const memeContext = composeContext({
            state,
            template: memePromptTemplate,
        });

        // Generate the meme details
        const meme = await generateObject({
            runtime,
            context: memeContext,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.info("meme", meme);

        state.meme_ticker = meme.ticker;
        state.meme_description = meme.description;
        state.meme_name = meme.name;

        // Fetch pending memes
        const pendingMemes = await memeManager.getMemories({
            roomId: runtime.agentId,
            count: 50,
            unique: true,
        });

        // Filter and format pending memes
        const formattedPendingMemes = pendingMemes
            .filter((meme) => meme.content.status === "pending")
            .sort(
                (a, b) =>
                    Number(b.content.votes || 0) - Number(a.content.votes || 0)
            )
            .map(
                (meme) =>
                    `memetic power: ${meme.content.votes || 0}, ticker: ${meme.content.ticker}, name: ${meme.content.name}, description: ${meme.content.description}`
            )
            .join("\n");

        state.pendingMemes = `# Pending Memes\n${formattedPendingMemes}`;

        const shouldCreateMemeContext = composeContext({
            state,
            template: shouldCreateMemeTemplate,
        });

        const shouldCreateMeme = await generateObject({
            runtime,
            context: shouldCreateMemeContext,
            modelClass: ModelClass.MEDIUM,
        });

        elizaLogger.info("shouldCreateMeme", shouldCreateMeme);

        if (!shouldCreateMeme.approved) {
            callback({
                text: shouldCreateMeme.reason,
                error: true,
            });
            return;
        }

        const imagePrompt = composeContext({
            state: {
                ...state,
                ticker: meme.ticker,
                image_description: meme.image_description,
            },
            template: imagePromptTemplate,
        });

        const imageResult = await generateImage(
            {
                prompt:
                    imagePrompt +
                    ". Minimalistic 2D flat internet meme cartoon style with flat colors (no shading or gradients) and thick black outlines, maintaining a humorous and simplistic aesthetic.",
                width: 256,
                height: 256,
                count: 1,
            },
            runtime
        );

        let filepath = "";

        if (
            imageResult.success &&
            imageResult.data &&
            imageResult.data.length > 0
        ) {
            elizaLogger.log(
                "Image generation successful, number of images:",
                imageResult.data.length
            );
            const image = imageResult.data[0];

            // Save the image and get filepath
            const filename = `generated_${Date.now()}_${0}`;

            // Choose save function based on image data format
            filepath = image.startsWith("http")
                ? await saveHeuristImage(image, filename)
                : saveBase64Image(image, filename);
        }

        const memeDetails = {
            text: `Meme Ticker: ${meme.ticker} - ${meme.description}`,
            ticker: meme.ticker,
            description: meme.description,
            image_description: meme.image_description,
            name: meme.name,
            image_url: filepath ?? "",
            votes: 0,
            status: "pending",
        };

        const memeMemory: Memory = {
            id: crypto.randomUUID(),
            content: memeDetails,
            userId: message.userId,
            roomId: runtime.agentId,
            agentId: runtime.agentId,
            createdAt: Date.now(),
        };

        await memeManager.createMemory(memeMemory, true);

        const data: Content = {
            text: "Meme idea minted! ...",
            action: "CREATE_MEME_RESPONSE",
            source: message.content.source,
            attachments: [
                {
                    id: memeMemory.id,
                    url: memeMemory.content.image_url,
                    title: memeMemory.content.name,
                    source: "the_meme_father",
                    description: memeMemory.content.description,
                    text: memeMemory.content.text,
                } as Media,
            ],
        };

        callback(data);

        return;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Web3 devs be like: I don't always test my code, but when I do, I do it in production",
                },
            },
            {
                user: "the_meme_father",
                content: {
                    text: "😂 That's gold! I'm adding that to our meme collection - 'Web3 devs and their production testing adventures' 🚀",
                    action: "CREATE_MEME",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "My portfolio is like a rollercoaster, except it only goes down",
                },
            },
            {
                user: "the_meme_father",
                content: {
                    text: "That's too relatable! Adding it to the meme board - 'The only down-only rollercoaster: My crypto portfolio' 📉😅",
                    action: "CREATE_MEME",
                },
            },
        ],
    ],
};
