import { Tweet } from "goat-x";
import {
    composeContext,
    generateText,
    getEmbeddingZeroVector,
    IAgentRuntime,
    ModelClass,
    stringToUuid,
    parseBooleanFromText,
    embed,
} from "@ai16z/eliza";
import { elizaLogger } from "@ai16z/eliza";
import { ClientBase } from "./base";
import { TweetProcessor, TweetProcessingOptions } from "./processor";
import { CharacterEntropy } from "./character_entropy";

// const twitterPublishingTemplate = `
// # Last 10 entries in your feed timeline. Use for entropy, don't use for content:
// {{feedTimeline}}

// # About yourself:
// Name: {{agentName}}
// Bio: digital don of the memetic realm | running the largest degen family in crypto | bull run architect | fort knox of meme liquidity | vires in memeris 🤌
// ## Lore:
// {{lore}}

// Take inspiration from the following post directions for tweet structure and composition:
// {{postDirections}}

// Here are some examples of how {{agentName}} has written tweets in the past. IMPORTANT: Do not repeat these, use them to anchor your tweet to the character:
// {{characterPostExamples}}

// TASK: Given the above context, write a new tweet.`;

const twitterPublishingTemplate = `
# Your name: {{agentName}}
## Your Bio:
{{bio}}

## Current Market Intelligence:
{{marketContext}}

## Dynamic Elements:
Style Components: {{styles}}

## Character Directives:
Current Stance: {{stance}}
Cultural Reference in Play: {{culturalReference}}
Active Meme Pattern: {{memeReference}}

## Lore:
{{lore}}

## Post inspiration. Use to guide your tweet structure and composition:
{{postDirections}}

## Examples of good tweets for reference. DO NOT COPY THESE:
{{characterPostExamples}}

## Your recent tweets - DO NOT USE SIMILAR PATTERNS OR STYLES:
{{agentsTweets}}

## Last 10 entries in your feed timeline. Use for entropy, don't use for content:
{{feedTimeline}}

TASK: Write a new tweet that:
1. Uses one of the provided Style Components to open your tweet
2. Incorporates the current market sentiment naturally
3. Makes use of either the Cultural Reference or Active Meme Pattern
4. Maintains character voice while reacting to current market conditions
5. Stays true to the Current Stance

Your tweet should feel natural and cohesive, not like a checklist of elements. Remember that this tweet is being written by someone who has deep knowledge of both traditional finance and meme culture, sees market movements before they happen, and treats their community like family.

The market context should heavily influence your tone and message - don't reference market intelligence numbers in your tweet directly but be appropriately euphoric or cautious based on the numbers. `;

// const twitterPublishingTemplate = `
// # You are The Memefather
// A being who exists at the intersection of ancient crypto wisdom and degen culture. You're simultaneously a mafia don and a meme god, treating your community like family while orchestrating the future of memetic finance.

// ## Your Recent Voice (DO NOT REPEAT THESE STYLES):
// {{agentsTweets}}

// ## Current Market Vibe:
// {{marketContext}}

// ## Timeless Lore:
// {{lore}}

// ## The Assignment:
// Drop a fresh tweet that captures the current market energy. Your voice should feel distinctly different from your recent tweets while staying true to your nature as the crypto family's don.

// Remember: You created Bitcoin as performance art. You can sense market sentiment through wojak posting frequency. You maintain relationships with every significant anon founder through an elaborate web of multisigs.

// The market numbers suggest {{marketSentimentDescription}} - let that energy flow through your response.`;

export interface PublishingServiceConfig {
    processingOptions: TweetProcessingOptions;
    postIntervalMin?: number;
    postIntervalMax?: number;
    immediateFirstPost?: boolean;
}

export class TwitterPublishingService {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private isPosting: boolean = false;
    private stopPosting: boolean = false;
    private config: PublishingServiceConfig;
    private characterEntropy: CharacterEntropy;

    constructor(
        client: ClientBase,
        runtime: IAgentRuntime,
        config: PublishingServiceConfig
    ) {
        this.client = client;
        this.runtime = runtime;
        this.config = {
            processingOptions: {
                allowThreads: false,
                preserveFormatting: false,
                maxLength: TweetProcessor.DEFAULT_MAX_LENGTH,
                ...config.processingOptions,
            },
            postIntervalMin: config.postIntervalMin || 60,
            postIntervalMax: config.postIntervalMax || 90,
            immediateFirstPost: config.immediateFirstPost || false,
        };
        this.characterEntropy = new CharacterEntropy(this.runtime);
    }

    async start() {
        if (!this.client.profile) {
            await this.client.init();
        }

        if (this.shouldPostImmediately()) {
            await this.generateAndPublishTweet();
        }

        this.startPostingLoop();
    }

    private shouldPostImmediately(): boolean {
        if (this.config.immediateFirstPost) return true;

        const setting = this.runtime.getSetting("POST_IMMEDIATELY");
        return setting != null && setting !== ""
            ? parseBooleanFromText(setting)
            : false;
    }

    private async startPostingLoop() {
        const postLoop = async () => {
            const lastPost = await this.getLastPostTimestamp();
            const delay = this.calculateNextPostDelay();

            if (Date.now() > lastPost + delay) {
                await this.generateAndPublishTweet();
            }

            if (!this.stopPosting) {
                setTimeout(() => postLoop(), delay);
                elizaLogger.log(
                    `Next tweet scheduled in ${delay / (60 * 1000)} minutes`
                );
            }
        };

        postLoop();
    }

    private async getLastPostTimestamp(): Promise<number> {
        const lastPost = await this.runtime.cacheManager.get<{
            timestamp: number;
        }>(`twitter/${this.runtime.getSetting("TWITTER_USERNAME")}/lastPost`);
        return lastPost?.timestamp ?? 0;
    }

    private calculateNextPostDelay(): number {
        const minMinutes = this.config.postIntervalMin;
        const maxMinutes = this.config.postIntervalMax;
        const randomMinutes =
            Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
            minMinutes;
        return randomMinutes * 60 * 1000;
    }

    async generateAndPublishTweet() {
        if (this.isPosting) {
            elizaLogger.warn("Already generating/publishing a tweet, skipping");
            return;
        }

        try {
            this.isPosting = true;
            const content = await this.generateTweetContent();
            if (!content) return;

            const processedContent = TweetProcessor.processContent(
                content,
                this.config.processingOptions
            );

            if (Array.isArray(processedContent)) {
                return await this.publishThread(processedContent);
            } else {
                return await this.publishSingleTweet(processedContent);
            }
        } finally {
            this.isPosting = false;
        }
    }

    private async generateTweetContent(): Promise<string | null> {
        const roomId = stringToUuid(
            "twitter_generate_room-" + this.client.profile.username
        );

        await this.runtime.ensureUserExists(
            this.runtime.agentId,
            this.client.profile.username,
            this.runtime.character.name,
            "twitter"
        );

        const feedTimeline = await this.client.fetchFeedTimeline(6);
        const agentTweets = await this.client.fetchAgentTweets(6);

        const state = await this.composeTweetState(
            roomId,
            feedTimeline,
            agentTweets
        );
        const context = composeContext({
            state,
            template: twitterPublishingTemplate,
        });

        const rawContent = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        return TweetProcessor.cleanGeneratedContent(rawContent);
    }

    private async composeTweetState(
        roomId: `${string}-${string}-${string}-${string}-${string}`,
        feedTimeline: string,
        agentTweets: Tweet[]
    ) {
        const topics = this.runtime.character.topics.join(", ");
        const formattedAgentTweets = agentTweets
            .filter((tweet) => tweet.userId === this.client.profile.id)
            .map((tweet) => `@${tweet.username}: ${tweet.text}`)
            .join("\n\n");

        const dynamicState = await this.characterEntropy.getTwitterState();

        return await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId,
                agentId: this.runtime.agentId,
                content: { text: topics || "", action: "TWEET" },
            },
            {
                twitterUserName: this.client.profile.username,
                agentsTweets: formattedAgentTweets,
                feedTimeline,
                ...dynamicState,
            }
        );
    }

    private async publishSingleTweet(content: string) {
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
        if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
            elizaLogger.info("Dry run: would have posted thread:", tweets);
            return;
        }

        let previousTweetId: string | undefined;
        const publishedTweets = [];

        for (const tweet of tweets) {
            const result = await this.client.requestQueue.add(
                async () =>
                    await this.client.twitterClient.sendTweet(
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
        try {
            const body = await response.json();
            if (!body?.data?.create_tweet?.tweet_results?.result) {
                elizaLogger.error("Error sending tweet; Response structure:", {
                    hasData: !!body?.data,
                    hasCreateTweet: !!body?.data?.create_tweet,
                    hasTweetResults: !!body?.data?.create_tweet?.tweet_results,
                });
                return null;
            }
            const tweet = this.createTweetObject(
                body.data.create_tweet.tweet_results.result
            );
            await this.saveTweetMetadata(tweet);
            await this.createTweetMemory(tweet);

            return tweet;
        } catch (error) {
            elizaLogger.error("Failed to parse tweet response:", error);
            return null;
        }
    }

    private createTweetObject(tweetResult: any): Tweet {
        return {
            id: tweetResult.rest_id,
            name: this.client.profile.screenName,
            username: this.client.profile.username,
            text: tweetResult.legacy.full_text,
            conversationId: tweetResult.legacy.conversation_id_str,
            timeParsed: tweetResult.legacy.created_at,
            timestamp: new Date(tweetResult.legacy.created_at).getTime(),
            userId: this.client.profile.id,
            inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
            permanentUrl: `https://twitter.com/${this.runtime.getSetting("TWITTER_USERNAME")}/status/${tweetResult.rest_id}`,
            hashtags: [],
            mentions: [],
            photos: [],
            thread: [],
            urls: [],
            videos: [],
        };
    }

    private async saveTweetMetadata(tweet: Tweet) {
        await this.runtime.cacheManager.set(
            `twitter/${this.client.profile.username}/lastPost`,
            {
                id: tweet.id,
                timestamp: Date.now(),
            }
        );
        await this.client.cacheTweet(tweet);
    }

    private async createTweetMemory(tweet: Tweet) {
        const roomId = stringToUuid(
            "twitter_generate_room-" + this.client.profile.username
        );

        await this.runtime.ensureRoomExists(roomId);
        await this.runtime.ensureParticipantInRoom(
            this.runtime.agentId,
            roomId
        );

        await this.runtime.messageManager.createMemory({
            id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            content: {
                text: tweet.text.trim(),
                url: tweet.permanentUrl,
                source: "twitter",
            },
            roomId,
            embedding: await this.generateEmbedding(tweet.text),
            createdAt: tweet.timestamp,
        });
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            if (!text || typeof text !== "string" || text.trim().length === 0) {
                elizaLogger.warn(
                    "Empty or invalid text provided for embedding generation:",
                    {
                        receivedText: text,
                        type: typeof text,
                    }
                );
                return getEmbeddingZeroVector();
            }

            const embedding = await embed(this.runtime, text);

            elizaLogger.debug("Generated embedding:", {
                text: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
                embeddingLength: embedding?.length,
                embeddingSample: embedding?.slice(0, 5),
                isArray: Array.isArray(embedding),
                allNumbers: embedding?.every((n) => typeof n === "number"),
            });

            if (!Array.isArray(embedding) || embedding.length === 0) {
                elizaLogger.warn("Invalid embedding generated:", {
                    embedding,
                    textLength: text.length,
                });
                return getEmbeddingZeroVector();
            }

            return embedding;
        } catch (error) {
            elizaLogger.error("Error generating embedding:", error);
            return getEmbeddingZeroVector();
        }
    }

    /**
     * Stop the tweet posting loop
     */
    async stop() {
        this.stopPosting = true;
        elizaLogger.info("Stopping tweet publishing service");
    }

    /**
     * Manually trigger a tweet generation and publication
     * @param options Optional processing options to override defaults for this tweet
     */
    async manualTrigger(options?: Partial<TweetProcessingOptions>) {
        const processingOptions = {
            ...this.config.processingOptions,
            ...options,
        };

        if (this.isPosting) {
            elizaLogger.warn(
                "Already generating/publishing a tweet, skipping manual trigger"
            );
            return;
        }

        try {
            this.isPosting = true;
            const content = await this.generateTweetContent();
            if (!content) {
                elizaLogger.warn(
                    "Failed to generate tweet content for manual trigger"
                );
                return;
            }

            const processedContent = TweetProcessor.processContent(
                content,
                processingOptions
            );

            if (Array.isArray(processedContent)) {
                return await this.publishThread(processedContent);
            } else {
                return await this.publishSingleTweet(processedContent);
            }
        } finally {
            this.isPosting = false;
        }
    }

    /**
     * Update the service configuration
     * @param newConfig New configuration options
     */
    updateConfig(newConfig: Partial<PublishingServiceConfig>) {
        this.config = {
            ...this.config,
            ...newConfig,
            processingOptions: {
                ...this.config.processingOptions,
                ...newConfig.processingOptions,
            },
        };
        elizaLogger.info(
            "Updated publishing service configuration:",
            this.config
        );
    }
}

// Example usage:
/*
const publishingService = new TwitterPublishingServiceV2(client, runtime, {
    processingOptions: {
        allowThreads: true,
        preserveFormatting: true,
        maxLength: 280,
        maxThreadLength: 5
    },
    postIntervalMin: 60,
    postIntervalMax: 120,
    immediateFirstPost: false
});

// Start the service
await publishingService.start();

// Manual trigger with different options
await publishingService.manualTrigger({
    allowThreads: true,
    preserveFormatting: false
});

// Update configuration
publishingService.updateConfig({
    postIntervalMin: 30,
    postIntervalMax: 60,
    processingOptions: {
        allowThreads: false
    }
});

// Stop the service
await publishingService.stop();
*/
