// tweet-processor.ts
import { Tweet } from "goat-x";

export interface TweetProcessingOptions {
    allowThreads: boolean;
    preserveFormatting: boolean;
    maxLength?: number;
    maxThreadLength?: number;
    dryRun?: boolean;
}

export class TweetProcessor {
    private static readonly MAX_TWEET_LENGTH = 280;

    static getMaxLength(options: TweetProcessingOptions): number {
        return options.maxLength || TweetProcessor.MAX_TWEET_LENGTH;
    }

    static processContent(content: string, options: TweetProcessingOptions): string | string[] {
        const maxLength = TweetProcessor.getMaxLength(options);

        if (options.allowThreads) {
            return TweetProcessor.splitIntoThread(content, maxLength, options.preserveFormatting);
        }
        return TweetProcessor.truncateToFit(content, maxLength);
    }

    private static truncateToFit(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }

        const truncatedAtPeriod = text.slice(0, text.lastIndexOf(".", maxLength) + 1);
        if (truncatedAtPeriod.trim().length > 0) {
            return truncatedAtPeriod.trim();
        }

        const truncatedAtSpace = text.slice(0, text.lastIndexOf(" ", maxLength));
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
            ? content.split("\n\n").map(p => p.trim())
            : [content];
        const tweets: string[] = [];
        let currentTweet = "";

        for (const paragraph of paragraphs) {
            if (!paragraph) continue;

            if ((currentTweet + "\n\n" + paragraph).trim().length <= maxLength) {
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
                    const chunks = TweetProcessor.splitLongParagraph(paragraph, maxLength);
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

    private static splitLongParagraph(paragraph: string, maxLength: number): string[] {
        const sentences = paragraph.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g) || [paragraph];
        const chunks: string[] = [];
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + " " + sentence).trim().length <= maxLength) {
                currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                }
                if (sentence.length <= maxLength) {
                    currentChunk = sentence;
                } else {
                    const words = sentence.split(" ");
                    currentChunk = words[0];
                    for (let i = 1; i < words.length; i++) {
                        const nextChunk = currentChunk + " " + words[i];
                        if (nextChunk.length <= maxLength) {
                            currentChunk = nextChunk;
                        } else {
                            chunks.push(currentChunk.trim());
                            currentChunk = words[i];
                        }
                    }
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    static isValidTweet(tweet: Tweet): boolean {
        const hashtagCount = (tweet.text?.match(/#/g) || []).length;
        const atCount = (tweet.text?.match(/@/g) || []).length;
        const dollarSignCount = (tweet.text?.match(/\$/g) || []).length;
        const totalCount = hashtagCount + atCount + dollarSignCount;

        return (
            hashtagCount <= 1 &&
            atCount <= 2 &&
            dollarSignCount <= 1 &&
            totalCount <= 3
        );
    }
}
// twitter-publishing-service-v2.ts
import { TweetProcessor, TweetProcessingOptions } from './tweet-processor';
import { ClientBase } from './base';
import { IAgentRuntime, elizaLogger } from '@ai16z/eliza';

export class TwitterPublishingServiceV2 {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private isPosting: boolean = false;
    private stopPosting: boolean = false;
    private defaultProcessingOptions: TweetProcessingOptions;

    constructor(
        client: ClientBase,
        runtime: IAgentRuntime,
        options?: Partial<TweetProcessingOptions>
    ) {
        this.client = client;
        this.runtime = runtime;
        this.defaultProcessingOptions = {
            allowThreads: false,
            preserveFormatting: false,
            maxLength: 280,
            ...options
        };
    }

    async publishContent(
        content: string,
        options?: Partial<TweetProcessingOptions>
    ) {
        if (this.isPosting) {
            elizaLogger.warn("Already publishing content, skipping");
            return;
        }

        try {
            this.isPosting = true;
            const processingOptions = {
                ...this.defaultProcessingOptions,
                ...options
            };

            const processed = TweetProcessor.processContent(content, processingOptions);

            if (Array.isArray(processed)) {
                return await this.publishThread(processed);
            }
            return await this.publishSingleTweet(processed);
        } finally {
            this.isPosting = false;
        }
    }

    private async publishSingleTweet(content: string) {
        elizaLogger.info(`Publishing single tweet: ${content}`);

        if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
            elizaLogger.info(`Dry run: would have posted tweet: ${content}`);
            return;
        }

        const result = await this.client.requestQueue.add(
            async () => await this.client.twitterClient.sendTweet(content)
        );

        return await this.handleTweetResponse(result);
    }

    private async publishThread(tweets: string[]) {
        elizaLogger.info(`Publishing thread of ${tweets.length} tweets`);

        if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
            elizaLogger.info(`Dry run: would have posted thread:`, tweets);
            return;
        }

        let previousTweetId: string | undefined;
        const publishedTweets = [];

        for (const tweet of tweets) {
            const result = await this.client.requestQueue.add(
                async () => await this.client.twitterClient.sendTweet(
                    tweet,
                    previousTweetId
                )
            );

            const publishedTweet = await this.handleTweetResponse(result);
            if (publishedTweet) {
                previousTweetId = publishedTweet.id;
                publishedTweets.push(publishedTweet);
            }
        }

        return publishedTweets;
    }

    private async handleTweetResponse(response: Response) {
        const body = await response.json();

        if (!body?.data?.create_tweet?.tweet_results?.result) {
            elizaLogger.error("Error sending tweet; Bad response:", body);
            return null;
        }

        const tweet = this.createTweetObject(body.data.create_tweet.tweet_results.result);
        await this.saveTweetMetadata(tweet);

        return tweet;
    }

    // ... rest of the existing TwitterPublishingService methods ...
}
