import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    composeContext,
    generateText,
    generateImage,
    ModelClass,
    elizaLogger,
} from "@ai16z/eliza";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

const imagePromptTemplate = `
Create a meme image for:
TICKER: {{ticker}}
DESCRIPTION: {{description}}
CATEGORY: {{category}}

Generate a concise, meme-style image prompt that:
1. Captures the essence of the meme
2. Uses visual meme conventions
3. Has clear foreground and background elements

Keep it under 100 words and focus on visual elements only.`;

// Add this interface before the createMemeAction
interface MemeDetails {
    TICKER: string;
    DESCRIPTION: string;
    CATEGORY: string;
}

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
        "Save a meme-worthy conversation or idea to the meme leaderboard",
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
        const memeManager = runtime.getMemoryManager("memes");
        if (!memeManager) {
            callback({
                text: "Failed to create meme: Meme manager not found",
                error: true,
            });
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
                .replace(/```json\n?/, "") // Remove opening ```json
                .replace(/```\n?/, "") // Remove closing ```
                .trim(); // Remove any extra whitespace

            parsedMemeDetails = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse meme details:", e);
            console.log("Raw meme details:", memeDetails);
            callback({ text: "Failed to parse meme details", error: true });
            return;
        }

        const imagePromptContext = composeContext({
            state: { ...state, parsedMemeDetails },
            template: imagePromptTemplate,
        });

        // Generate the meme details
        const imagePrompt = await generateText({
            runtime,
            context: imagePromptContext,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.info("imagePrompt", imagePrompt);

        const imageResult = await generateImage(
            {
                prompt: imagePrompt,
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
                image_url: filepath ?? "",
                votes: 0,
                status: "pending",
            },
            userId: message.userId,
            roomId: runtime.agentId,
            agentId: runtime.agentId,
            createdAt: Date.now(),
        };

        await memeManager.createMemory(memeMemory, true);

        return {
            text: "That's hilarious! I've saved it as a meme. The community can vote on it in the leaderboard! 🎯",
            action: "CREATE_MEME",
        };
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
