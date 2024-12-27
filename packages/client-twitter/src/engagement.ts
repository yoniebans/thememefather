import { Tweet } from "agent-twitter-client";
import {
    composeContext,
    generateText,
    IAgentRuntime,
    ModelClass,
    stringToUuid,
    elizaLogger,
    IImageDescriptionService,
    ServiceType,
    generateObjectDEPRECATED,
} from "@ai16z/eliza";
import { ClientBase } from "./base";
import { buildConversationThread } from "./utils";
import { TweetProcessor } from "./processor";
import { twitterActionTemplate } from "./prompts/engagement/action";
import { twitterReplyTemplate } from "./prompts/engagement/anthropic/reply";
import { twitterQuoteTemplate } from "./prompts/engagement/quote";

export interface EngagementServiceConfig {
    processingInterval: number; // How often to check timeline in ms
    timelineDepth: number; // How many tweets to fetch from timeline
    dryRun?: boolean; // If true, log actions but don't execute
}

export class TwitterEngagementService {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private config: EngagementServiceConfig;
    private isProcessing: boolean = false;
    private stopProcessing: boolean = false;

    constructor(
        client: ClientBase,
        runtime: IAgentRuntime,
        config: EngagementServiceConfig
    ) {
        this.client = client;
        this.runtime = runtime;
        this.config = {
            processingInterval: 300000, // 5 minutes default
            timelineDepth: 15, // 15 tweets default
            ...config,
        };
    }

    async start() {
        if (!this.client.profile) {
            await this.client.init();
        }

        this.startProcessingLoop();
        elizaLogger.log("Engagement service started");
    }

    private async startProcessingLoop() {
        const processLoop = async () => {
            if (this.stopProcessing) return;

            try {
                await this.processTimelineEngagement();
            } catch (error) {
                elizaLogger.error(
                    "Error in engagement processing loop:",
                    error
                );
            }

            if (!this.stopProcessing) {
                setTimeout(processLoop, this.config.processingInterval);
                elizaLogger.log(
                    `Next engagement check scheduled in ${this.config.processingInterval / 60000} minutes`
                );
            }
        };

        processLoop();
    }

    async stop() {
        this.stopProcessing = true;
        elizaLogger.log("Stopping engagement service");
    }

    private async processTimelineEngagement() {
        if (this.isProcessing) {
            elizaLogger.warn("Already processing timeline, skipping");
            return;
        }

        try {
            this.isProcessing = true;
            elizaLogger.log("Processing timeline for engagement opportunities");

            const timeline = await this.client.fetchTimelineForActions(
                this.config.timelineDepth
            );
            elizaLogger.debug(
                "fetched timeline for actions; length:",
                timeline.length
            );
            const results = [];

            for (const tweet of timeline) {
                // Skip if already processed
                const existingMemory =
                    await this.runtime.messageManager.getMemoryById(
                        stringToUuid(tweet.id + "-" + this.runtime.agentId)
                    );
                if (existingMemory) {
                    elizaLogger.debug(`Already processed tweet ${tweet.id}`);
                    continue;
                }

                const actions = await this.determineEngagementActions(tweet);
                if (actions) {
                    const executedActions = await this.executeEngagementActions(
                        tweet,
                        actions
                    );
                    await this.saveTweetMemory(tweet, executedActions);
                    results.push({ tweet, actions, executedActions });
                }
            }

            elizaLogger.log(
                `Processed ${results.length} new tweets for engagement`
            );
            return results;
        } catch (error) {
            elizaLogger.error("Error processing timeline engagement:", error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private async determineEngagementActions(tweet: Tweet) {
        const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
        );

        const state = await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId,
                agentId: this.runtime.agentId,
                content: { text: tweet.text, action: "" },
            },
            {
                twitterUserName: this.runtime.getSetting("TWITTER_USERNAME"),
                currentTweet: `ID: ${tweet.id}\nFrom: ${tweet.name} (@${tweet.username})\nText: ${tweet.text}`,
            }
        );

        const context = composeContext({
            state,
            template: twitterActionTemplate,
        });

        return await generateObjectDEPRECATED({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });
    }

    private async executeEngagementActions(tweet: Tweet, actions: any) {
        const executedActions: string[] = [];

        // Validate mutual exclusivity
        const primaryActions = [actions.retweet, actions.quote, actions.reply];
        const primaryActionCount = primaryActions.filter(Boolean).length;
        if (primaryActionCount > 1) {
            elizaLogger.error(
                `Invalid action combination: Multiple primary actions selected for tweet ${tweet.id}`
            );
            return executedActions;
        }

        try {
            // Handle like first as it can combine with other actions
            if (actions.like) {
                if (this.config.dryRun) {
                    elizaLogger.info(`[DRY RUN] Would like tweet ${tweet.id}`);
                    executedActions.push("like");
                } else {
                    await this.client.twitterClient.likeTweet(tweet.id);
                    executedActions.push("like");
                }
            }

            // Handle mutually exclusive primary actions
            if (actions.retweet) {
                if (this.config.dryRun) {
                    elizaLogger.info(`[DRY RUN] Would retweet ${tweet.id}`);
                    executedActions.push("retweet");
                } else {
                    await this.client.twitterClient.retweet(tweet.id);
                    executedActions.push("retweet");
                }
            } else if (actions.quote) {
                const success = await this.handleQuoteTweet(tweet);
                if (success) executedActions.push("quote");
            } else if (actions.reply) {
                const success = await this.handleReplyTweet(tweet);
                if (success) executedActions.push("reply");
            }
        } catch (error) {
            elizaLogger.error(
                `Error executing actions for tweet ${tweet.id}:`,
                error
            );
        }

        return executedActions;
    }

    private async handleQuoteTweet(tweet: Tweet): Promise<boolean> {
        try {
            const context = await this.buildEngagementContext(tweet, "QUOTE");
            const quoteContent = await this.generateEngagementContent(
                context,
                twitterQuoteTemplate
            );

            if (!quoteContent) return false;

            if (this.config.dryRun) {
                elizaLogger.info(
                    `[DRY RUN] Would quote tweet ${tweet.id} with content:\n${quoteContent}`
                );
                return true;
            }

            const result = await this.client.requestQueue.add(
                async () =>
                    await this.client.twitterClient.sendQuoteTweet(
                        quoteContent,
                        tweet.id
                    )
            );

            const success = await this.validateTwitterResponse(result);
            if (success) {
                await this.cacheGenerationContext(
                    "quote",
                    tweet.id,
                    context,
                    quoteContent
                );
            }
            return success;
        } catch (error) {
            elizaLogger.error("Error generating quote tweet:", error);
            return false;
        }
    }

    private async handleReplyTweet(tweet: Tweet): Promise<boolean> {
        try {
            const context = await this.buildEngagementContext(tweet, "REPLY");
            const replyContent = await this.generateEngagementContent(
                context,
                twitterReplyTemplate
            );

            if (!replyContent) return false;

            if (this.config.dryRun) {
                elizaLogger.info(
                    `[DRY RUN] Would reply to tweet ${tweet.id} with content:\n${replyContent}`
                );
                return true;
            }

            const result = await this.client.requestQueue.add(
                async () =>
                    await this.client.twitterClient.sendTweet(
                        replyContent,
                        tweet.id
                    )
            );

            const success = await this.validateTwitterResponse(result);
            if (success) {
                await this.cacheGenerationContext(
                    "reply",
                    tweet.id,
                    context,
                    replyContent
                );
            }
            return success;
        } catch (error) {
            elizaLogger.error("Error generating reply tweet:", error);
            return false;
        }
    }

    private async buildEngagementContext(tweet: Tweet, action: string) {
        const thread = await buildConversationThread(tweet, this.client);
        const conversation = thread
            .map(
                (t) =>
                    `@${t.username} (${new Date(t.timestamp * 1000).toLocaleString()}): ${t.text}`
            )
            .join("\n\n");

        const imageDescriptions = await this.getImageDescriptions(tweet);

        return await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId: stringToUuid(
                    tweet.conversationId + "-" + this.runtime.agentId
                ),
                agentId: this.runtime.agentId,
                content: { text: tweet.text, action },
            },
            {
                twitterUserName: this.runtime.getSetting("TWITTER_USERNAME"),
                currentPost: `From @${tweet.username}: ${tweet.text}`,
                formattedConversation: conversation,
                imageContext:
                    imageDescriptions.length > 0
                        ? `\nImages in Tweet:\n${imageDescriptions.map((desc, i) => `Image ${i + 1}: ${desc}`).join("\n")}`
                        : "",
            }
        );
    }

    private async getImageDescriptions(tweet: Tweet): Promise<string[]> {
        const descriptions: string[] = [];
        if (tweet.photos?.length > 0) {
            const imageService =
                this.runtime.getService<IImageDescriptionService>(
                    ServiceType.IMAGE_DESCRIPTION
                );
            for (const photo of tweet.photos) {
                try {
                    const result = await imageService.describeImage(photo.url);
                    descriptions.push(result.description);
                } catch (error) {
                    elizaLogger.error(
                        "Error getting image description:",
                        error
                    );
                }
            }
        }
        return descriptions;
    }

    private async generateEngagementContent(
        context: any,
        template: string
    ): Promise<string | null> {
        const content = await generateText({
            runtime: this.runtime,
            context: composeContext({
                state: context,
                template: template,
            }),
            modelClass: ModelClass.LARGE,
        });

        if (typeof content !== "string") {
            elizaLogger.error("Generated content is not a string:", content);
            return null;
        }

        try {
            const processed = TweetProcessor.processContent(content, {
                allowThreads: false,
                preserveFormatting: false,
            }) as string;

            if (!processed) {
                elizaLogger.error(
                    "Tweet processing returned empty result for content:",
                    content
                );
                return null;
            }

            return processed;
        } catch (error) {
            elizaLogger.error(
                "Error processing tweet content:",
                error,
                "Original content:",
                content
            );
            return null;
        }
    }

    private async validateTwitterResponse(
        response: Response
    ): Promise<boolean> {
        try {
            const body = await response.json();
            return !!body?.data?.create_tweet?.tweet_results?.result;
        } catch (error) {
            elizaLogger.error("Error validating Twitter response:", error);
            return false;
        }
    }

    private async cacheGenerationContext(
        type: string,
        tweetId: string,
        context: any,
        content: string
    ) {
        await this.runtime.cacheManager.set(
            `twitter/${type}_generation_${tweetId}.txt`,
            `Context:\n${JSON.stringify(context, null, 2)}\n\nGenerated ${type}:\n${content}`
        );
    }

    private async saveTweetMemory(tweet: Tweet, executedActions: string[]) {
        const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
        );

        await this.runtime.ensureRoomExists(roomId);
        await this.runtime.ensureUserExists(
            stringToUuid(tweet.userId),
            tweet.username,
            tweet.name,
            "twitter"
        );
        await this.runtime.ensureParticipantInRoom(
            this.runtime.agentId,
            roomId
        );

        await this.runtime.messageManager.createMemory({
            id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
            userId: stringToUuid(tweet.userId),
            content: {
                text: tweet.text,
                url: tweet.permanentUrl,
                source: "twitter",
                action: executedActions.join(","),
            },
            agentId: this.runtime.agentId,
            roomId,
            embedding: await this.client.generateEmbedding(tweet.text),
            createdAt: tweet.timestamp * 1000,
        });
    }

    updateConfig(newConfig: Partial<EngagementServiceConfig>) {
        this.config = {
            ...this.config,
            ...newConfig,
        };
        elizaLogger.log(
            "Updated engagement service configuration:",
            this.config
        );
    }
}