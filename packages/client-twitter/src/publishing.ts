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
import { CharacterEntropy } from "./entropy_market";
import { LunarCrushEntropy } from "./entropy_lunar_crush";
import { twitterPublishingTemplate_lunarQuote } from "./prompts/publishing/lunar-crush";
import {
    twitterPublishingTemplate_dynamic,
    twitterPublishingTemplate_feedTimeline,
} from "./prompts/publishing/default";

interface TemplateConfig {
    templates: {
        [key: string]: {
            template: string;
            weight: number;
        };
    };
}

export interface PublishingServiceConfig {
    processingOptions: TweetProcessingOptions;
    postIntervalMin?: number;
    postIntervalMax?: number;
    immediateFirstPost?: boolean;
    dryRun?: boolean;
    enabledNormal?: boolean;
    enabledLunarCrush?: boolean;
    lunarCrushApiToken?: string;
}

export class TwitterPublishingService {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private isPosting: boolean = false;
    private stopPosting: boolean = false;
    private config: PublishingServiceConfig;
    private characterEntropy: CharacterEntropy;
    private lunarCrushEntropy: LunarCrushEntropy;
    private templateConfig: TemplateConfig = {
        templates: {
            dynamic: {
                template: twitterPublishingTemplate_dynamic,
                weight: 1,
            },
            feed: {
                template: twitterPublishingTemplate_feedTimeline,
                weight: 1,
            },
        },
    };

    constructor(
        client: ClientBase,
        runtime: IAgentRuntime,
        config: PublishingServiceConfig
    ) {
        elizaLogger.info(
            "Initializing publishing service with config:",
            config
        );
        this.client = client;
        this.runtime = runtime;
        this.config = {
            processingOptions: {
                allowThreads: config.processingOptions?.allowThreads ?? false,
                preserveFormatting:
                    config.processingOptions?.preserveFormatting ?? false,
                maxLength:
                    config.processingOptions?.maxLength ??
                    TweetProcessor.DEFAULT_MAX_LENGTH,
                ...config.processingOptions,
            },
            postIntervalMin: config.postIntervalMin ?? 60,
            postIntervalMax: config.postIntervalMax ?? 90,
            immediateFirstPost: config.immediateFirstPost ?? false,
            dryRun: config.dryRun ?? false,
            enabledNormal: config.enabledNormal ?? true,
            enabledLunarCrush: config.enabledLunarCrush ?? false,
            lunarCrushApiToken: config.lunarCrushApiToken ?? "",
        };
        this.characterEntropy = new CharacterEntropy(this.runtime);
        this.lunarCrushEntropy = new LunarCrushEntropy(
            this.runtime,
            this.config.lunarCrushApiToken,
            this.client
        );
    }

    async start() {
        elizaLogger.info(
            "Starting publishing service with config:",
            this.config
        );
        if (!this.client.profile) {
            await this.client.init();
        }

        if (this.config.enabledNormal) {
            if (this.shouldPostImmediately()) {
                elizaLogger.info("Posting first tweet immediately");
                await this.generateAndPublishTweet();
            }
            this.startRegularPostLoop();
        }
        if (this.config.enabledLunarCrush) {
            this.startLunarCrushPostLoop();
        }
    }

    private shouldPostImmediately(): boolean {
        if (this.config.immediateFirstPost) return true;

        const setting = this.runtime.getSetting("POST_IMMEDIATELY");
        return setting != null && setting !== ""
            ? parseBooleanFromText(setting)
            : false;
    }

    private async startRegularPostLoop() {
        elizaLogger.info("Starting regular post loop");
        const regularPostLoop = async () => {
            const lastPost = await this.getLastPostTimestamp("lastPost");
            const delay = this.calculateNextPostDelay();

            if (Date.now() > lastPost + delay) {
                await this.generateAndPublishTweet();
            }

            if (!this.stopPosting) {
                setTimeout(() => regularPostLoop(), delay);
                elizaLogger.log(
                    `Next regular tweet scheduled in ${delay / (60 * 1000)} minutes`
                );
            }
        };

        regularPostLoop();
    }

    private async startLunarCrushPostLoop() {
        elizaLogger.info("Starting lunar crush post loop");
        const lunarCrushPostLoop = async () => {
            const lastLunarPost =
                await this.getLastPostTimestamp("lastLunarPost");
            const twentyFourHours = 4 * 60 * 60 * 1000;
            let nextDelay: number;

            if (Date.now() > lastLunarPost + twentyFourHours) {
                try {
                    const lunarPost =
                        await this.lunarCrushEntropy.findPostToQuote();
                    if (lunarPost) {
                        // Check if we've already processed this post
                        const existingMemory =
                            await this.runtime.messageManager.getMemoryById(
                                stringToUuid(
                                    lunarPost.post.id +
                                        "-" +
                                        this.runtime.agentId
                                )
                            );

                        if (existingMemory) {
                            elizaLogger.debug(
                                `Already processed lunar crush post ${lunarPost.post.id}`
                            );
                            // If we've already processed this post, try again in 1 hour
                            nextDelay = 60 * 60 * 1000;
                        } else {
                            const quoteContent =
                                await this.generateQuoteTweetContent(lunarPost);
                            if (quoteContent) {
                                if (this.config.dryRun) {
                                    elizaLogger.info(
                                        `Dry run: would have posted quote tweet: ${quoteContent} quoting: ${lunarPost.post.id}`
                                    );
                                } else {
                                    const result =
                                        await this.client.requestQueue.add(
                                            async () =>
                                                await this.client.twitterClient.sendQuoteTweet(
                                                    quoteContent,
                                                    lunarPost.post.id
                                                )
                                        );

                                    const tweet =
                                        await this.handleTweetResponse(result);
                                    if (tweet) {
                                        await this.updateLastPostTimestamp(
                                            "lastLunarPost"
                                        );
                                        // Save memory of processing this lunar crush post
                                        await this.saveLunarCrushMemory(
                                            lunarPost
                                        );
                                        nextDelay = twentyFourHours;
                                    } else {
                                        nextDelay = 60 * 60 * 1000;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    elizaLogger.error(
                        "Error processing lunar crush post:",
                        error
                    );
                    nextDelay = 60 * 60 * 1000;
                }
            } else {
                nextDelay = Math.max(
                    0,
                    lastLunarPost + twentyFourHours - Date.now()
                );
            }

            if (!this.stopPosting) {
                const finalDelay = Math.max(
                    nextDelay || twentyFourHours,
                    60 * 1000
                );
                setTimeout(() => lunarCrushPostLoop(), finalDelay);
                elizaLogger.log(
                    `Next lunar crush post scheduled in ${(finalDelay / (60 * 60 * 1000)).toFixed(2)} hours`
                );
            }
        };

        lunarCrushPostLoop();
    }

    private async saveLunarCrushMemory(lunarPost: any) {
        const roomId = stringToUuid(
            "twitter_quote_room-" + this.client.profile.username
        );

        await this.runtime.ensureRoomExists(roomId);
        await this.runtime.ensureParticipantInRoom(
            this.runtime.agentId,
            roomId
        );

        // Create memory for the processed lunar crush post
        await this.runtime.messageManager.createMemory({
            id: stringToUuid(lunarPost.post.id + "-" + this.runtime.agentId),
            userId: this.runtime.agentId,
            content: {
                text: lunarPost.post.text,
                url: `https://twitter.com/${lunarPost.post.tweet.username}/status/${lunarPost.post.id}`,
                source: "twitter_lunar_crush",
                topic: lunarPost.topic,
                reasoning: lunarPost.reasoning,
            },
            agentId: this.runtime.agentId,
            roomId,
            embedding: await this.generateEmbedding(lunarPost.post.text),
            createdAt: Date.now(),
        });
    }

    private async generateQuoteTweetContent(
        lunarPost: any
    ): Promise<string | null> {
        const roomId = stringToUuid(
            "twitter_quote_room-" + this.client.profile.username
        );

        await this.runtime.ensureUserExists(
            this.runtime.agentId,
            this.client.profile.username,
            this.runtime.character.name,
            "twitter"
        );

        const state = await this.composeTweetState(
            roomId,
            "", // No need for feed timeline in quote tweets
            [] // No need for agent tweets in quote tweets
        );

        // Add quote-specific context
        const quoteContext = {
            quoteText: lunarPost.post.text,
            quoteUsername: lunarPost.post.tweet.username,
            interactionStats: `${lunarPost.post.interactions_24h.toLocaleString()} interactions in 24h`,
            quoteTopic: lunarPost.topic,
            quoteReasoning: lunarPost.reasoning,
        };

        const context = composeContext({
            state: { ...state, ...quoteContext },
            template: twitterPublishingTemplate_lunarQuote,
        });

        const rawContent = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        // First clean the content
        const cleanContent = TweetProcessor.cleanGeneratedContent(rawContent);
        if (!cleanContent) return null;

        // Then process it with proper options
        try {
            const processed = TweetProcessor.processContent(cleanContent, {
                allowThreads: false,
                preserveFormatting: false,
                maxLength: TweetProcessor.DEFAULT_MAX_LENGTH,
            }) as string;

            if (!processed) {
                elizaLogger.error(
                    "Tweet processing returned empty result for content:",
                    cleanContent
                );
                return null;
            }

            return processed;
        } catch (error) {
            elizaLogger.error(
                "Error processing tweet content:",
                error,
                "Original content:",
                cleanContent
            );
            return null;
        }
    }

    private async getLastPostTimestamp(
        type: "lastPost" | "lastLunarPost"
    ): Promise<number> {
        const lastPost = await this.runtime.cacheManager.get<{
            timestamp: number;
        }>(`twitter/${this.runtime.getSetting("TWITTER_USERNAME")}/${type}`);
        return lastPost?.timestamp ?? 0;
    }

    private async updateLastPostTimestamp(
        type: "lastPost" | "lastLunarPost"
    ): Promise<void> {
        await this.runtime.cacheManager.set(
            `twitter/${this.runtime.getSetting("TWITTER_USERNAME")}/${type}`,
            {
                timestamp: Date.now(),
            }
        );
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
            template: await this.selectTemplate(),
        });

        const rawContent = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        return TweetProcessor.cleanGeneratedContent(rawContent);
    }

    private async getTemplateHistory(): Promise<string[]> {
        const memoryKey = `twitter/${this.runtime.getSetting("TWITTER_USERNAME")}/template_history`;
        const history = await this.runtime.cacheManager.get<{
            templates: string[];
        }>(memoryKey);
        return history?.templates ?? [];
    }

    private async updateTemplateHistory(templateType: string): Promise<void> {
        const memoryKey = `twitter/${this.runtime.getSetting("TWITTER_USERNAME")}/template_history`;
        let history = await this.getTemplateHistory();
        history = [...history, templateType].slice(-3);
        await this.runtime.cacheManager.set(memoryKey, { templates: history });
    }

    private async selectTemplate(): Promise<string> {
        const history = await this.getTemplateHistory();
        let templateType: string;

        if (
            history.length >= 2 &&
            history.slice(-2).every((t) => t === history.slice(-1)[0])
        ) {
            const lastType = history[history.length - 1];
            const availableTypes = Object.keys(
                this.templateConfig.templates
            ).filter((t) => t !== lastType);
            templateType =
                availableTypes[
                    Math.floor(Math.random() * availableTypes.length)
                ];
            elizaLogger.info(`Selected template (forced): ${templateType}`);
        } else {
            const totalWeight = Object.values(
                this.templateConfig.templates
            ).reduce((sum, t) => sum + t.weight, 0);
            let random = Math.random() * totalWeight;

            for (const [type, config] of Object.entries(
                this.templateConfig.templates
            )) {
                random -= config.weight;
                if (random <= 0) {
                    templateType = type;
                    break;
                }
            }
            elizaLogger.info(
                `Selected template (weighted random): ${templateType}`
            );
        }

        await this.updateTemplateHistory(templateType);
        return this.templateConfig.templates[templateType].template;
    }

    private async composeTweetState(
        roomId: `${string}-${string}-${string}-${string}-${string}`,
        feedTimeline: string,
        agentTweets: Tweet[]
    ) {
        const topics = this.runtime.character.topics.join(", ");
        const formattedAgentTweets = agentTweets
            .filter((tweet) => tweet.userId === this.client.profile.id)
            .slice(0, 5) // Take only the first 5 tweets
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
        if (this.config.dryRun) {
            elizaLogger.info(`Dry run: would have posted tweet: ${content}`);
            return;
        }

        const result = await this.client.requestQueue.add(
            async () => await this.client.twitterClient.sendTweet(content)
        );

        return await this.handleTweetResponse(result);
    }

    private async publishThread(tweets: string[]) {
        if (this.config.dryRun) {
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

    private async saveTweetMetadata(
        tweet: Tweet,
        type: "lastPost" | "lastLunarPost" = "lastPost"
    ) {
        await this.updateLastPostTimestamp(type);
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
