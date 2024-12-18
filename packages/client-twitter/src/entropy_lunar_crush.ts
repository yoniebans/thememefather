import { IAgentRuntime } from "@ai16z/eliza";
import { elizaLogger } from "@ai16z/eliza";
import {
    composeContext,
    generateObjectDEPRECATED,
    ModelClass,
} from "@ai16z/eliza";
import { ClientBase } from "./base";
import { Tweet } from "agent-twitter-client";

interface TopicData {
    topic: string;
    title: string;
    topic_rank: number;
    num_contributors: number;
    num_posts: number;
    interactions_1h: number;
    interactions_24h: number;
}

interface TopicPost {
    // LunarCrush fields
    id: string;
    post_type: string;
    post_title: string;
    post_link: string;
    post_created: number;
    post_sentiment: number;
    creator_name: string;
    creator_display_name: string;
    interactions_24h: number;
    interactions_total: number;

    // Full Twitter data
    tweet?: Tweet;
}

interface RetryConfig {
    maxRetries?: number;
    delay?: number;
    maxDelay?: number;
    backoff?: (
        retryCount: number,
        baseDelay: number,
        maxDelay: number
    ) => number;
}

const topicSelectionTemplate = `
# INSTRUCTIONS: Choose the most relevant topics for {{agentName}} to engage with based on their interests and character.

About {{agentName}}:
{{bio}}
{{lore}}

Available Topics:
{{availableTopics}}

# TASK: Select up to 5 topics that best align with {{agentName}}'s interests and personality.
# Respond with a JSON markdown block containing an ordered array of selected topic strings:

\`\`\`json
{
    "selectedTopics": ["topic1", "topic2", "topic3"]
}
\`\`\`
`;

const postSelectionTemplate = `
# INSTRUCTIONS: Choose the most impactful post for {{agentName}} to quote retweet. Stay focused on the crypto space.

About {{agentName}}:
{{bio}}
{{lore}}

Available Posts for Topic "{{topic}}":
{{availablePosts}}

# TASK: Select the single most relevant post that {{agentName}} should quote retweet.
# Consider post engagement, sentiment, and alignment with {{agentName}}'s character.
# Respond with a JSON markdown block:

\`\`\`json
{
    "selectedPostId": "post-id-here",
    "reasoning": "Brief explanation of why this post was chosen"
}
\`\`\`
`;

export class LunarCrushEntropy {
    private runtime: IAgentRuntime;
    private apiToken: string;
    private client: ClientBase;

    constructor(runtime: IAgentRuntime, apiToken: string, client: ClientBase) {
        this.runtime = runtime;
        this.apiToken = apiToken;
        this.client = client;
    }

    private async fetchWithRetry<T>(
        url: string,
        options?: RequestInit,
        config: RetryConfig = {}
    ): Promise<T> {
        const {
            maxRetries = 3,
            delay = 1000,
            maxDelay = 10000,
            backoff = (retryCount, baseDelay, maxDelay) =>
                Math.min(baseDelay * Math.pow(2, retryCount), maxDelay),
        } = config;

        // Log the request details (excluding sensitive info)
        elizaLogger.debug("Making LunarCrush API request:", {
            url,
            method: options?.method || "GET",
            hasAuthHeader: !!options?.headers?.["Authorization"],
        });

        let lastError: Error | null = null;

        for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        ...options?.headers,
                    },
                });

                // Log response status and relevant headers
                elizaLogger.debug("LunarCrush API response:", {
                    status: response.status,
                    statusText: response.statusText,
                    contentType: response.headers.get("content-type"),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    elizaLogger.error("LunarCrush API error response:", {
                        status: response.status,
                        body: errorBody,
                    });
                    throw new Error(
                        `LunarCrush API HTTP status: ${response.status}, Body: ${errorBody}`
                    );
                }

                const data = await response.json();
                // elizaLogger.debug("LunarCrush API response data:", {
                //     preview: Array.isArray(data) ? data.slice(0, 1) : data,
                //     type: typeof data,
                //     isArray: Array.isArray(data),
                // });
                return data;
            } catch (error) {
                // Improve error logging
                elizaLogger.debug(`Error fetching ${url}:`, {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    cause: error.cause,
                });
                lastError = error as Error;

                if (retryCount === maxRetries) break;

                const nextDelay = backoff(retryCount, delay, maxDelay);
                elizaLogger.debug(
                    `Retry #${retryCount + 1} in ${nextDelay}ms...`
                );
                await new Promise((resolve) => setTimeout(resolve, nextDelay));
            }
        }

        throw lastError;
    }

    private async fetchViralTopics(): Promise<TopicData[]> {
        try {
            const data = await this.fetchWithRetry<{ data: TopicData[] }>(
                "https://lunarcrush.com/api4/public/topics/list/v1",
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );
            return data.data.slice(0, 20);
        } catch (error) {
            elizaLogger.error(
                "Failed to fetch viral topics after all retries:",
                error
            );
            return [];
        }
    }

    private async fetchTopicPosts(topic: string): Promise<TopicPost[]> {
        elizaLogger.debug(`Fetching posts for topic: ${topic}`);
        try {
            // 1. Fetch posts from LunarCrush
            const data = await this.fetchWithRetry<{ data: TopicPost[] }>(
                `https://lunarcrush.com/api4/public/topic/${topic}/posts/v1`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );
            // Filter for tweets only and take top 5
            const tweetPosts = data.data
                .filter((post) => post.post_type === "tweet")
                .slice(0, 5);

            elizaLogger.debug(
                `Retrieved ${tweetPosts.length} posts from LunarCrush`
            );

            // 2. Enrich with full tweet data
            const enrichedPosts = await Promise.all(
                tweetPosts.map(async (post) => {
                    const tweetId = post.id || post.post_link?.split("/").pop();
                    if (!tweetId) {
                        elizaLogger.warn(
                            `No tweet ID found for post: ${JSON.stringify(post)}`
                        );
                        return post;
                    }

                    try {
                        elizaLogger.debug(
                            `Fetching full tweet data for ID: ${tweetId}`
                        );
                        const fullTweet = await this.client.getTweet(tweetId);
                        return { ...post, tweet: fullTweet };
                    } catch (error) {
                        elizaLogger.error(
                            `Failed to fetch tweet ${tweetId}:`,
                            error
                        );
                        return post;
                    }
                })
            );

            const enrichedCount = enrichedPosts.filter((p) => p.tweet).length;
            elizaLogger.info(
                `Successfully enriched ${enrichedCount}/${tweetPosts.length} posts with tweet data`
            );
            return enrichedPosts;
        } catch (error) {
            elizaLogger.error(
                `Failed to fetch/process posts for topic ${topic}:`,
                error
            );
            return [];
        }
    }

    private async selectTopics(topics: TopicData[]): Promise<string[]> {
        const formattedTopics = topics
            .map(
                (t) =>
                    `- ${t.title} (${t.topic})\n  Rank: ${t.topic_rank}, Contributors: ${t.num_contributors}, 24h Interactions: ${t.interactions_24h}`
            )
            .join("\n");

        const state = await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                content: { text: "", action: "" },
            },
            {
                availableTopics: formattedTopics,
            }
        );

        const context = composeContext({
            state,
            template: topicSelectionTemplate,
        });

        const result = await generateObjectDEPRECATED({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        return result.selectedTopics || [];
    }

    private formatPostForTemplate(post: TopicPost): string {
        const tweet = post.tweet;
        if (!tweet) {
            // Fallback to basic LunarCrush data if no tweet data available
            return `
ID: ${post.id}
Author: ${post.creator_display_name} (@${post.creator_name})
Content: ${post.post_title}
24h Interactions: ${post.interactions_24h}
Sentiment: ${post.post_sentiment}
            `.trim();
        }

        const engagement = `👍 ${tweet.likes || 0} | 🔄 ${tweet.retweets || 0} | 💬 ${tweet.replies || 0} | 👁️ ${tweet.views || 0}`;
        const contentType = [
            tweet.photos?.length ? `📷 ${tweet.photos.length} photos` : "",
            tweet.videos?.length ? `🎥 ${tweet.videos.length} videos` : "",
            tweet.poll ? "📊 Poll" : "",
            tweet.thread?.length
                ? `🧵 Thread (${tweet.thread.length} tweets)`
                : "",
            tweet.isQuoted ? "💭 Quote tweet" : "",
            tweet.isRetweet ? "🔄 Retweet" : "",
            tweet.sensitiveContent ? "⚠️ Sensitive content" : "",
        ]
            .filter(Boolean)
            .join(" | ");

        return `
ID: ${post.id}
Author: ${post.creator_display_name} (@${post.creator_name})
Content: ${tweet.text || post.post_title}
Engagement: ${engagement}
Content Type: ${contentType}
LunarCrush Sentiment: ${post.post_sentiment}
${tweet.hashtags?.length ? `Tags: ${tweet.hashtags.join(" ")}` : ""}
${tweet.mentions?.length ? `Mentions: ${tweet.mentions.map((m) => "@" + m.username).join(" ")}` : ""}
${tweet.quotedStatus ? `Quoted Tweet: ${tweet.quotedStatus.text}` : ""}
${tweet.retweetedStatus ? `Retweeted Tweet: ${tweet.retweetedStatus.text}` : ""}
        `.trim();
    }

    private async selectPost(
        topic: string,
        posts: TopicPost[]
    ): Promise<{ postId: string; reasoning: string } | null> {
        const formattedPosts = posts
            .map((post) => this.formatPostForTemplate(post))
            .join("\n\n---\n\n"); // Add separator between posts for clarity

        const state = await this.runtime.composeState(
            {
                userId: this.runtime.agentId,
                roomId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                content: { text: "", action: "" },
            },
            {
                topic,
                availablePosts: formattedPosts,
            }
        );

        const context = composeContext({
            state,
            template: postSelectionTemplate,
        });

        const result = await generateObjectDEPRECATED({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        if (!result.selectedPostId) return null;

        return {
            postId: result.selectedPostId,
            reasoning: result.reasoning,
        };
    }
    public async findPostToQuote(): Promise<{
        topic: string;
        post: TopicPost;
        reasoning: string;
    } | null> {
        try {
            elizaLogger.info("Starting post discovery process");

            // 1. Fetch viral topics
            elizaLogger.debug("Fetching viral topics from LunarCrush");
            const topics = await this.fetchViralTopics();
            if (topics.length === 0) {
                elizaLogger.info("No viral topics found, aborting");
                return null;
            }
            elizaLogger.info(`Found ${topics.length} viral topics to evaluate`);

            // 2. Let LLM select preferred topics
            elizaLogger.debug("Selecting preferred topics via LLM");
            const selectedTopics = await this.selectTopics(topics);
            if (selectedTopics.length === 0) {
                elizaLogger.info("No topics selected by LLM, aborting");
                return null;
            }
            elizaLogger.info(
                `LLM selected ${selectedTopics.length} topics: ${selectedTopics.join(", ")}`
            );

            // 3. Try each selected topic in order
            for (const topic of selectedTopics) {
                elizaLogger.debug(`Fetching posts for topic: ${topic}`);
                const posts = await this.fetchTopicPosts(topic);
                if (posts.length === 0) {
                    elizaLogger.debug(
                        `No posts found for topic: ${topic}, trying next topic`
                    );
                    continue;
                }
                elizaLogger.info(
                    `Found ${posts.length} posts for topic: ${topic}`
                );

                // 4. Let LLM select the best post
                elizaLogger.debug("Selecting best post via LLM");
                const selection = await this.selectPost(topic, posts);
                if (!selection) {
                    elizaLogger.debug(
                        "No post selected by LLM, trying next topic"
                    );
                    continue;
                }

                const selectedPost = posts.find(
                    (p) => p.id === selection.postId
                );
                if (selectedPost) {
                    elizaLogger.info(
                        `Successfully selected post ${selection.postId} from topic ${topic}`
                    );
                    elizaLogger.debug(
                        "Selection reasoning:",
                        selection.reasoning
                    );
                    return {
                        topic,
                        post: selectedPost,
                        reasoning: selection.reasoning,
                    };
                }
            }

            elizaLogger.info(
                "No suitable posts found across all selected topics"
            );
            return null;
        } catch (error) {
            elizaLogger.error("Error finding post to quote:", error);
            return null;
        }
    }
}
