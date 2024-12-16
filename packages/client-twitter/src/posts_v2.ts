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
import { ClientBase } from "./base.ts";

const twitterPublishingTemplate = `
# Last 10 entries in your feed timeline. Use for entropy, don't use for content:
{{feedTimeline}}

# About yourself:
Name: {{agentName}}
Bio: digital don of the memetic realm | running the largest degen family in crypto | bull run architect | fort knox of meme liquidity | vires in memeris 🤌
## Lore:
{{lore}}

Take inspiration from the following post directions for tweet structure and composition:
{{postDirections}}

Here are some examples of how {{agentName}} has written tweets in the past. IMPORTANT: Do not repeat these, use them to anchor your tweet to the character:
{{characterPostExamples}}

TASK: Given the above context, write a new tweet.`;

const MAX_TWEET_LENGTH = 240;

export class TwitterPublishingService {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private isPosting: boolean = false;
    private stopPosting: boolean = false;

    constructor(client: ClientBase, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;
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

    private truncateToCompleteSentence(text: string): string {
        if (text.length <= MAX_TWEET_LENGTH) {
            return text;
        }

        const truncatedAtPeriod = text.slice(
            0,
            text.lastIndexOf(".", MAX_TWEET_LENGTH) + 1
        );
        if (truncatedAtPeriod.trim().length > 0) {
            return truncatedAtPeriod.trim();
        }

        const truncatedAtSpace = text.slice(
            0,
            text.lastIndexOf(" ", MAX_TWEET_LENGTH)
        );
        if (truncatedAtSpace.trim().length > 0) {
            return truncatedAtSpace.trim() + "...";
        }

        return text.slice(0, MAX_TWEET_LENGTH - 3).trim() + "...";
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
        const minMinutes =
            parseInt(this.runtime.getSetting("POST_INTERVAL_MIN")) || 60;
        const maxMinutes =
            parseInt(this.runtime.getSetting("POST_INTERVAL_MAX")) || 90;
        const randomMinutes =
            Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
            minMinutes;
        return randomMinutes * 60 * 1000;
    }

    private async generateAndPublishTweet() {
        if (this.isPosting) {
            elizaLogger.warn("Already generating/publishing a tweet, skipping");
            return;
        }

        try {
            this.isPosting = true;
            elizaLogger.info("Generating new tweet");
            const roomId = stringToUuid(
                "twitter_generate_room-" + this.client.profile.username
            );
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                this.client.profile.username,
                this.runtime.character.name,
                "twitter"
            );

            const topics = this.runtime.character.topics.join(", ");
            const homeTimeline = await this.client.fetchAgentTweets(10);
            const feedTimeline = await this.client.fetchFeedTimeline(10);

            const agentsTweets = homeTimeline
                .filter((tweet) => tweet.userId === this.client.profile.id)
                .map((tweet) => `@${tweet.username}: ${tweet.text}`)
                .join("\n\n");

            const state = await this.runtime.composeState(
                {
                    userId: this.runtime.agentId,
                    roomId: roomId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: topics || "",
                        action: "TWEET",
                    },
                },
                {
                    twitterUserName: this.client.profile.username,
                    agentsTweets: agentsTweets || "",
                    feedTimeline: feedTimeline || [],
                }
            );

            const context = composeContext({
                state,
                template: twitterPublishingTemplate,
            });

            elizaLogger.debug("generate post prompt:\n" + context);

            const newTweetContent = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            let cleanedContent = "";

            try {
                const parsedResponse = JSON.parse(newTweetContent);
                if (parsedResponse.text) {
                    cleanedContent = parsedResponse.text;
                } else if (typeof parsedResponse === "string") {
                    cleanedContent = parsedResponse;
                }
            } catch (error) {
                elizaLogger.error("Error parsing tweet content:", error);
                cleanedContent = newTweetContent
                    .replace(/^\s*{?\s*"text":\s*"|"\s*}?\s*$/g, "")
                    .replace(/^['"](.*)['"]$/g, "$1")
                    .replace(/\\"/g, '"')
                    .trim();
            }

            if (!cleanedContent) {
                elizaLogger.error(
                    "Failed to extract valid content from response:",
                    {
                        rawResponse: newTweetContent,
                        attempted: "JSON parsing",
                    }
                );
                return;
            }

            const content = this.truncateToCompleteSentence(cleanedContent);
            const finalContent = content.replace(/^['"](.*)['"]$/, "$1");

            if (this.runtime.getSetting("TWITTER_DRY_RUN") === "true") {
                elizaLogger.info(
                    `Dry run: would have posted tweet: ${finalContent}`
                );
                return;
            }

            try {
                elizaLogger.log(`Posting new tweet:\n ${finalContent}`);

                const result = await this.client.requestQueue.add(
                    async () =>
                        await this.client.twitterClient.sendTweet(finalContent)
                );
                const body = await result.json();

                if (!body?.data?.create_tweet?.tweet_results?.result) {
                    console.error("Error sending tweet; Bad response:", body);
                    return;
                }

                const tweetResult = body.data.create_tweet.tweet_results.result;
                const tweet = this.createTweetObject(tweetResult);

                await this.saveTweetMetadata(tweet);
                await this.createTweetMemory(tweet, newTweetContent, roomId);

                elizaLogger.log(`Tweet posted:\n ${tweet.permanentUrl}`);
            } catch (error) {
                elizaLogger.error("Error sending tweet:", error);
            }
        } catch (error) {
            elizaLogger.error("Error generating new tweet:", error);
        } finally {
            this.isPosting = false;
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

    private async createTweetMemory(
        tweet: Tweet,
        content: string,
        roomId: `${string}-${string}-${string}-${string}-${string}`
    ) {
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
                text: content.trim(),
                url: tweet.permanentUrl,
                source: "twitter",
            },
            roomId,
            embedding: await this.generateEmbedding(tweet.text),
            createdAt: tweet.timestamp,
        });
    }

    async stop() {
        this.stopPosting = true;
    }
}
