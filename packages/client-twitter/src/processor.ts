import { elizaLogger } from "@ai16z/eliza";

export interface TweetProcessingOptions {
    allowThreads: boolean;
    preserveFormatting: boolean;
    maxLength?: number;
    maxThreadLength?: number;
}

export class TweetProcessor {
    static readonly DEFAULT_MAX_LENGTH = 280;

    static processContent(
        content: string,
        options: TweetProcessingOptions
    ): string | string[] {
        elizaLogger.debug("Processing content with options:", options);
        const maxLength =
            options.maxLength || TweetProcessor.DEFAULT_MAX_LENGTH;

        if (!content) {
            throw new Error("Content cannot be empty");
        }

        if (options.allowThreads) {
            return TweetProcessor.splitIntoThread(
                content,
                maxLength,
                options.preserveFormatting
            );
        }
        return TweetProcessor.truncateToFit(content, maxLength);
    }

    static cleanGeneratedContent(rawContent: string): string {
        // If input is empty or whitespace, return empty string
        if (!rawContent?.trim()) {
            return "";
        }

        // Check if content is wrapped in markdown code blocks
        const codeBlockMatch = rawContent.match(
            /```(?:json)?\s*([\s\S]*?)\s*```/
        );
        if (codeBlockMatch) {
            elizaLogger.debug("Processing content from code block");
            rawContent = codeBlockMatch[1];
        }

        // Check if it looks like JSON
        if (rawContent.trim().match(/^[{\[]/)) {
            elizaLogger.debug("Attempting to process content as JSON");
            try {
                const parsedResponse = JSON.parse(rawContent);
                if (parsedResponse.text) {
                    return parsedResponse.text;
                } else if (typeof parsedResponse === "string") {
                    return parsedResponse;
                }
                // If JSON parsed but didn't have expected format, fall through to text processing
                elizaLogger.debug(
                    "JSON parsed but didn't match expected format, processing as text"
                );
            } catch (error) {
                elizaLogger.error(
                    "Content is not valid JSON, processing as plain text:",
                    error
                );
                elizaLogger.error("Problematic raw content:", rawContent); // Add this line
            }
        }

        // If not JSON or code block, return the raw content as is
        return rawContent.trim();
    }

    private static truncateToFit(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }

        const truncatedAtPeriod = text.slice(
            0,
            text.lastIndexOf(".", maxLength) + 1
        );
        if (truncatedAtPeriod.trim().length > 0) {
            return truncatedAtPeriod.trim();
        }

        const truncatedAtSpace = text.slice(
            0,
            text.lastIndexOf(" ", maxLength)
        );
        if (truncatedAtSpace.trim().length > 0) {
            return truncatedAtSpace.trim() + "...";
        }

        return text.slice(0, maxLength - 3).trim() + "...";
    }

    private static splitIntoThread(
        content: string,
        maxLength: number,
        preserveFormatting: boolean
    ): string[] {
        const paragraphs = preserveFormatting
            ? content.split("\n\n").map((p) => p.trim())
            : [content];
        const tweets: string[] = [];
        let currentTweet = "";

        for (const paragraph of paragraphs) {
            if (!paragraph) continue;

            if (
                (currentTweet + "\n\n" + paragraph).trim().length <= maxLength
            ) {
                currentTweet = currentTweet
                    ? currentTweet + "\n\n" + paragraph
                    : paragraph;
            } else {
                if (currentTweet) {
                    tweets.push(currentTweet.trim());
                }
                if (paragraph.length <= maxLength) {
                    currentTweet = paragraph;
                } else {
                    const chunks = this.splitParagraph(paragraph, maxLength);
                    tweets.push(...chunks.slice(0, -1));
                    currentTweet = chunks[chunks.length - 1];
                }
            }
        }

        if (currentTweet) {
            tweets.push(currentTweet.trim());
        }

        return tweets;
    }

    private static splitParagraph(
        paragraph: string,
        maxLength: number
    ): string[] {
        const sentences = paragraph.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g) || [
            paragraph,
        ];
        return this.splitSentences(sentences, maxLength);
    }

    private static splitSentences(
        sentences: string[],
        maxLength: number
    ): string[] {
        const chunks: string[] = [];
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + " " + sentence).trim().length <= maxLength) {
                currentChunk = currentChunk
                    ? currentChunk + " " + sentence
                    : sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                if (sentence.length <= maxLength) {
                    currentChunk = sentence;
                } else {
                    const words = sentence.split(" ");
                    const wordChunks = this.splitWords(words, maxLength);
                    chunks.push(...wordChunks.slice(0, -1));
                    currentChunk = wordChunks[wordChunks.length - 1];
                }
            }
        }

        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }

    private static splitWords(words: string[], maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = words[0];

        for (let i = 1; i < words.length; i++) {
            const nextChunk = currentChunk + " " + words[i];
            if (nextChunk.length <= maxLength) {
                currentChunk = nextChunk;
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = words[i];
            }
        }

        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }
}
