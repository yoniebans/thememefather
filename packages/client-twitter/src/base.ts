import {
    Content,
    IAgentRuntime,
    IImageDescriptionService,
    Memory,
    State,
    UUID,
    getEmbeddingZeroVector,
    elizaLogger,
    stringToUuid,
    embed,
} from "@ai16z/eliza";
import {
    QueryTweetsResponse,
    Scraper,
    SearchMode,
    Tweet,
} from "agent-twitter-client";
import { EventEmitter } from "events";
import { sampleSize } from "lodash";

export function extractAnswer(text: string): string {
    const startIndex = text.indexOf("Answer: ") + 8;
    const endIndex = text.indexOf("<|endoftext|>", 11);
    return text.slice(startIndex, endIndex);
}

interface InitializationLock {
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: Error) => void;
}

type TwitterProfile = {
    id: string;
    username: string;
    screenName: string;
    bio: string;
    nicknames: string[];
};

class RequestQueue {
    private queue: (() => Promise<any>)[] = [];
    private processing: boolean = false;

    async add<T>(request: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await request();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;

        while (this.queue.length > 0) {
            const request = this.queue.shift()!;
            try {
                await request();
            } catch (error) {
                console.error("Error processing request:", error);
                this.queue.unshift(request);
                await this.exponentialBackoff(this.queue.length);
            }
            await this.randomDelay();
        }

        this.processing = false;
    }

    private async exponentialBackoff(retryCount: number): Promise<void> {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    private async randomDelay(): Promise<void> {
        const delay = Math.floor(Math.random() * 2000) + 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}

export class ClientBase extends EventEmitter {
    static _twitterClients: { [accountIdentifier: string]: Scraper } = {};
    private static _initializationLock: InitializationLock | null = null;
    private static _initialized: boolean = false;
    twitterClient: Scraper;
    runtime: IAgentRuntime;
    directions: string;
    lastCheckedTweetId: bigint | null = null;
    imageDescriptionService: IImageDescriptionService;
    temperature: number = 0.5;

    requestQueue: RequestQueue = new RequestQueue();

    profile: TwitterProfile | null;

    async cacheTweet(tweet: Tweet): Promise<void> {
        try {
            if (!tweet) {
                elizaLogger.warn("Tweet is undefined, skipping cache");
                return;
            }

            elizaLogger.debug(`Attempting to cache tweet ${tweet.id}`, {
                tweetId: tweet.id,
                hasThread: Boolean(tweet.thread?.length),
                threadLength: tweet.thread?.length,
            });

            // Create a sanitized version of the tweet without circular references
            const sanitizedTweet = {
                id: tweet.id,
                name: tweet.name,
                username: tweet.username,
                text: tweet.text,
                inReplyToStatusId: tweet.inReplyToStatusId,
                timestamp: tweet.timestamp,
                userId: tweet.userId,
                conversationId: tweet.conversationId,
                permanentUrl: tweet.permanentUrl,
                hashtags: tweet.hashtags,
                mentions: tweet.mentions,
                photos: tweet.photos,
                // Only include essential thread info, not the full objects
                thread: tweet.thread?.map((t) => ({
                    id: t.id,
                    text: t.text,
                    timestamp: t.timestamp,
                })),
                urls: tweet.urls,
                videos: tweet.videos,
            };

            elizaLogger.debug(`Sanitized tweet ${tweet.id} for caching`, {
                sanitizedKeys: Object.keys(sanitizedTweet),
            });

            await this.runtime.cacheManager.set(
                `twitter/tweets/${tweet.id}`,
                sanitizedTweet
            );

            elizaLogger.debug(`Successfully cached tweet ${tweet.id}`);
        } catch (error) {
            elizaLogger.error(`Failed to cache tweet ${tweet?.id}:`, {
                error: error.message,
                stack: error.stack,
                tweet: JSON.stringify(tweet, null, 2).slice(0, 500), // Log first 500 chars of tweet
            });
            // Don't throw the error - just log it and continue
            // This prevents the application from crashing
        }
    }

    async getCachedTweet(tweetId: string): Promise<Tweet | undefined> {
        const cached = await this.runtime.cacheManager.get<Tweet>(
            `twitter/tweets/${tweetId}`
        );

        return cached;
    }

    async getTweet(tweetId: string): Promise<Tweet> {
        try {
            const cachedTweet = await this.getCachedTweet(tweetId);

            if (cachedTweet) {
                elizaLogger.debug(`Retrieved tweet ${tweetId} from cache`);
                return cachedTweet;
            }

            elizaLogger.debug(`Fetching tweet ${tweetId} from Twitter`);
            const tweet = await this.requestQueue.add(() =>
                this.twitterClient.getTweet(tweetId)
            );

            // Cache the tweet but don't await it - let it happen in the background
            this.cacheTweet(tweet).catch((error) => {
                elizaLogger.error(
                    `Background caching failed for tweet ${tweetId}:`,
                    error
                );
            });

            return tweet;
        } catch (error) {
            elizaLogger.error(`Failed to get tweet ${tweetId}:`, {
                error: error.message,
                stack: error.stack,
            });
            throw error; // Still throw the error as this is a core functionality
        }
    }

    callback: (self: ClientBase) => any = null;

    onReady() {
        throw new Error(
            "Not implemented in base class, please call from subclass"
        );
    }

    constructor(runtime: IAgentRuntime) {
        super();
        this.runtime = runtime;
        const username = this.runtime.getSetting("TWITTER_USERNAME");
        if (ClientBase._twitterClients[username]) {
            this.twitterClient = ClientBase._twitterClients[username];
        } else {
            this.twitterClient = new Scraper();
            ClientBase._twitterClients[username] = this.twitterClient;
        }

        this.directions =
            "- " +
            this.runtime.character.style.all.join("\n- ") +
            "- " +
            this.runtime.character.style.post.join();
    }

    private static createInitializationLock(): InitializationLock {
        let resolveFn: () => void;
        let rejectFn: (error: Error) => void;

        const promise = new Promise<void>((resolve, reject) => {
            resolveFn = resolve;
            rejectFn = reject;
        });

        return {
            promise,
            resolve: resolveFn!,
            reject: rejectFn!,
        };
    }

    private async waitForInitialization(): Promise<void> {
        if (ClientBase._initialized) {
            return;
        }

        if (!ClientBase._initializationLock) {
            ClientBase._initializationLock =
                ClientBase.createInitializationLock();
        }

        await ClientBase._initializationLock.promise;
    }

    async init() {
        // If already initialized, just wait for completion and return
        if (ClientBase._initialized) {
            elizaLogger.debug("Twitter client already initialized");
            return;
        }

        // If initialization is in progress, wait for it
        if (ClientBase._initializationLock) {
            elizaLogger.debug(
                "Twitter client initialization in progress, waiting"
            );
            await this.waitForInitialization();
            return;
        }

        // Create initialization lock
        ClientBase._initializationLock = ClientBase.createInitializationLock();

        try {
            const username = this.runtime.getSetting("TWITTER_USERNAME");
            if (!username) {
                throw new Error("Twitter username not configured");
            }

            elizaLogger.log("Initializing Twitter client for", username);

            // First try to restore cookies and check if they're still valid
            let isLoggedIn = false;

            if (this.runtime.getSetting("TWITTER_COOKIES")) {
                elizaLogger.debug(
                    "Found cookies in settings, attempting to restore session"
                );
                const cookiesArray = JSON.parse(
                    this.runtime.getSetting("TWITTER_COOKIES")
                );
                await this.setCookiesFromArray(cookiesArray);
                isLoggedIn = await this.twitterClient.isLoggedIn();
            }

            if (!isLoggedIn) {
                elizaLogger.debug("Checking cached cookies");
                const cachedCookies = await this.getCachedCookies(username);
                if (cachedCookies) {
                    elizaLogger.debug(
                        "Found cached cookies, attempting to restore session"
                    );
                    await this.setCookiesFromArray(cachedCookies);
                    isLoggedIn = await this.twitterClient.isLoggedIn();
                }
            }

            // Only perform login if cookie restoration failed
            if (!isLoggedIn) {
                elizaLogger.log(
                    "No valid session found, performing fresh login"
                );
                while (true) {
                    await this.twitterClient.login(
                        username,
                        this.runtime.getSetting("TWITTER_PASSWORD"),
                        this.runtime.getSetting("TWITTER_EMAIL"),
                        this.runtime.getSetting("TWITTER_2FA_SECRET") ||
                            undefined
                    );

                    if (await this.twitterClient.isLoggedIn()) {
                        const cookies = await this.twitterClient.getCookies();
                        await this.cacheCookies(username, cookies);
                        break;
                    }

                    elizaLogger.error(
                        "Failed to login to Twitter, trying again..."
                    );
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            } else {
                elizaLogger.log("Successfully restored previous session");
            }

            // Initialize Twitter profile
            this.profile = await this.fetchProfile(username);

            if (this.profile) {
                elizaLogger.log("Twitter user ID:", this.profile.id);
                elizaLogger.log(
                    "Twitter loaded:",
                    JSON.stringify(this.profile, null, 10)
                );
                // Store profile info for use in responses
                this.runtime.character.twitterProfile = {
                    id: this.profile.id,
                    username: this.profile.username,
                    screenName: this.profile.screenName,
                    bio: this.profile.bio,
                    nicknames: this.profile.nicknames,
                };
            } else {
                throw new Error("Failed to load profile");
            }

            await this.loadLatestCheckedTweetId();
            await this.populateTimeline();

            // Mark as initialized and resolve the lock
            ClientBase._initialized = true;
            ClientBase._initializationLock.resolve();
        } catch (error) {
            // If initialization fails, reject the lock and clean up
            ClientBase._initializationLock?.reject(error as Error);
            ClientBase._initialized = false;
            ClientBase._initializationLock = null;
            throw error;
        } finally {
            // Clean up the lock
            ClientBase._initializationLock = null;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Enhanced validation
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

            // Generate embedding
            const embedding = await embed(this.runtime, text);

            // Log the embedding details
            elizaLogger.debug("Generated embedding:", {
                text: text.slice(0, 100) + (text.length > 100 ? "..." : ""), // First 100 chars of input
                embeddingLength: embedding?.length,
                embeddingSample: embedding?.slice(0, 5), // First 5 values
                isArray: Array.isArray(embedding),
                allNumbers: embedding?.every((n) => typeof n === "number"),
            });

            // Validate embedding result
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

    async fetchAgentTweets(count: number): Promise<Tweet[]> {
        elizaLogger.debug("fetching agent tweets");
        const homeTimeline = await this.twitterClient.getUserTweets(
            this.profile.id,
            count
        );
        return homeTimeline.tweets;
    }

    async fetchFeedTimeline(count: number): Promise<string> {
        elizaLogger.debug("fetching feed timeline");
        const homeTimeline = await this.twitterClient.fetchHomeTimeline(
            count,
            []
        );

        const filteredAndOrdered = homeTimeline
            .filter((tweet) => tweet.text || tweet.legacy?.full_text)
            .sort((a, b) => {
                const timestampA = new Date(
                    a.createdAt ?? a.legacy?.created_at
                ).getTime();
                const timestampB = new Date(
                    b.createdAt ?? b.legacy?.created_at
                ).getTime();
                return timestampB - timestampA;
            });

        // Take only up to count entries after filtering and ordering
        const limitedTimeline =
            filteredAndOrdered.length > count
                ? filteredAndOrdered.slice(0, count)
                : filteredAndOrdered;

        return limitedTimeline
            .map(
                (tweet) =>
                    `@${tweet.username || tweet.core?.user_results?.result?.legacy?.screen_name}: ${tweet.text ?? tweet.legacy?.full_text ?? ""}`
            )
            .join("\n");
    }

    async fetchTimelineForActions(count: number): Promise<Tweet[]> {
        elizaLogger.debug("fetching timeline for actions; depth: ", count);
        const homeTimeline = await this.twitterClient.fetchHomeTimeline(
            count,
            []
        );
        // Only apply random sampling if we have more tweets than requested. workaround for fetchHomeTimeline not respecting count
        const timelineToProcess =
            homeTimeline.length > count
                ? sampleSize(homeTimeline, count)
                : homeTimeline;

        return timelineToProcess.map((tweet) => ({
            id: tweet.rest_id,
            name: tweet.core?.user_results?.result?.legacy?.name,
            username: tweet.core?.user_results?.result?.legacy?.screen_name,
            text: tweet.legacy?.full_text,
            inReplyToStatusId: tweet.legacy?.in_reply_to_status_id_str,
            timestamp: new Date(tweet.legacy?.created_at).getTime() / 1000,
            userId: tweet.legacy?.user_id_str,
            conversationId: tweet.legacy?.conversation_id_str,
            permanentUrl: `https://twitter.com/${tweet.core?.user_results?.result?.legacy?.screen_name}/status/${tweet.rest_id}`,
            hashtags: tweet.legacy?.entities?.hashtags || [],
            mentions: tweet.legacy?.entities?.user_mentions || [],
            photos:
                tweet.legacy?.entities?.media?.filter(
                    (media) => media.type === "photo"
                ) || [],
            thread: tweet.thread || [],
            urls: tweet.legacy?.entities?.urls || [],
            videos:
                tweet.legacy?.entities?.media?.filter(
                    (media) => media.type === "video"
                ) || [],
        }));
    }

    async fetchSearchTweets(
        query: string,
        maxTweets: number,
        searchMode: SearchMode,
        cursor?: string
    ): Promise<QueryTweetsResponse> {
        try {
            // Sometimes this fails because we are rate limited. in this case, we just need to return an empty array
            // if we dont get a response in 5 seconds, something is wrong
            const timeoutPromise = new Promise((resolve) =>
                setTimeout(() => resolve({ tweets: [] }), 10000)
            );

            try {
                const result = await this.requestQueue.add(
                    async () =>
                        await Promise.race([
                            this.twitterClient.fetchSearchTweets(
                                query,
                                maxTweets,
                                searchMode,
                                cursor
                            ),
                            timeoutPromise,
                        ])
                );
                return (result ?? { tweets: [] }) as QueryTweetsResponse;
            } catch (error) {
                elizaLogger.error("Error fetching search tweets:", error);
                return { tweets: [] };
            }
        } catch (error) {
            elizaLogger.error("Error fetching search tweets:", error);
            return { tweets: [] };
        }
    }

    private async populateTimeline() {
        elizaLogger.debug("populating timeline...");

        const cachedTimeline = await this.getCachedTimeline();

        // Check if the cache file exists
        if (cachedTimeline) {
            // Read the cached search results from the file

            // Get the existing memories from the database
            const existingMemories =
                await this.runtime.messageManager.getMemoriesByRoomIds({
                    roomIds: cachedTimeline.map((tweet) =>
                        stringToUuid(
                            tweet.conversationId + "-" + this.runtime.agentId
                        )
                    ),
                });

            //TODO: load tweets not in cache?

            // Create a Set to store the IDs of existing memories
            const existingMemoryIds = new Set(
                existingMemories.map((memory) => memory.id.toString())
            );

            // Check if any of the cached tweets exist in the existing memories
            const someCachedTweetsExist = cachedTimeline.some((tweet) =>
                existingMemoryIds.has(
                    stringToUuid(tweet.id + "-" + this.runtime.agentId)
                )
            );

            if (someCachedTweetsExist) {
                // Filter out the cached tweets that already exist in the database
                const tweetsToSave = cachedTimeline.filter(
                    (tweet) =>
                        !existingMemoryIds.has(
                            stringToUuid(tweet.id + "-" + this.runtime.agentId)
                        )
                );

                console.log({
                    processingTweets: tweetsToSave
                        .map((tweet) => tweet.id)
                        .join(","),
                });

                // Save the missing tweets as memories
                for (const tweet of tweetsToSave) {
                    elizaLogger.log("Saving Tweet", tweet.id);

                    const roomId = stringToUuid(
                        tweet.conversationId + "-" + this.runtime.agentId
                    );

                    const userId =
                        tweet.userId === this.profile.id
                            ? this.runtime.agentId
                            : stringToUuid(tweet.userId);

                    if (tweet.userId === this.profile.id) {
                        await this.runtime.ensureConnection(
                            this.runtime.agentId,
                            roomId,
                            this.profile.username,
                            this.profile.screenName,
                            "twitter"
                        );
                    } else {
                        await this.runtime.ensureConnection(
                            userId,
                            roomId,
                            tweet.username,
                            tweet.name,
                            "twitter"
                        );
                    }

                    const content = {
                        text: tweet.text,
                        url: tweet.permanentUrl,
                        source: "twitter",
                        inReplyTo: tweet.inReplyToStatusId
                            ? stringToUuid(
                                  tweet.inReplyToStatusId +
                                      "-" +
                                      this.runtime.agentId
                              )
                            : undefined,
                    } as Content;

                    elizaLogger.log("Creating memory for tweet", tweet.id);

                    // check if it already exists
                    const memory =
                        await this.runtime.messageManager.getMemoryById(
                            stringToUuid(tweet.id + "-" + this.runtime.agentId)
                        );

                    if (memory) {
                        elizaLogger.log(
                            "Memory already exists, skipping timeline population"
                        );
                        break;
                    }

                    await this.runtime.messageManager.createMemory({
                        id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
                        userId,
                        content: content,
                        agentId: this.runtime.agentId,
                        roomId,
                        embedding: getEmbeddingZeroVector(),
                        createdAt: tweet.timestamp * 1000,
                    });

                    await this.cacheTweet(tweet);
                }

                elizaLogger.log(
                    `Populated ${tweetsToSave.length} missing tweets from the cache.`
                );
                return;
            }
        }

        const timeline = await this.fetchAgentTweets(cachedTimeline ? 10 : 50);

        // Get the most recent 20 mentions and interactions
        const mentionsAndInteractions = await this.fetchSearchTweets(
            `@${this.runtime.getSetting("TWITTER_USERNAME")}`,
            20,
            SearchMode.Latest
        );

        // Combine the timeline tweets and mentions/interactions
        const allTweets = [...timeline, ...mentionsAndInteractions.tweets];

        // Create a Set to store unique tweet IDs
        const tweetIdsToCheck = new Set<string>();
        const roomIds = new Set<UUID>();

        // Add tweet IDs to the Set
        for (const tweet of allTweets) {
            tweetIdsToCheck.add(tweet.id);
            roomIds.add(
                stringToUuid(tweet.conversationId + "-" + this.runtime.agentId)
            );
        }

        // Check the existing memories in the database
        const existingMemories =
            await this.runtime.messageManager.getMemoriesByRoomIds({
                roomIds: Array.from(roomIds),
            });

        // Create a Set to store the existing memory IDs
        const existingMemoryIds = new Set<UUID>(
            existingMemories.map((memory) => memory.id)
        );

        // Filter out the tweets that already exist in the database
        const tweetsToSave = allTweets.filter(
            (tweet) =>
                !existingMemoryIds.has(
                    stringToUuid(tweet.id + "-" + this.runtime.agentId)
                )
        );

        elizaLogger.debug("Processing tweets", {
            processingTweets: tweetsToSave.map((tweet) => tweet.id).join(","),
        });

        await this.runtime.ensureUserExists(
            this.runtime.agentId,
            this.profile.username,
            this.runtime.character.name,
            "twitter"
        );

        // Save the new tweets as memories
        for (const tweet of tweetsToSave) {
            elizaLogger.log("Saving Tweet", tweet.id);

            const roomId = stringToUuid(
                tweet.conversationId + "-" + this.runtime.agentId
            );
            const userId =
                tweet.userId === this.profile.id
                    ? this.runtime.agentId
                    : stringToUuid(tweet.userId);

            if (tweet.userId === this.profile.id) {
                await this.runtime.ensureConnection(
                    this.runtime.agentId,
                    roomId,
                    this.profile.username,
                    this.profile.screenName,
                    "twitter"
                );
            } else {
                await this.runtime.ensureConnection(
                    userId,
                    roomId,
                    tweet.username,
                    tweet.name,
                    "twitter"
                );
            }

            const content = {
                text: tweet.text,
                url: tweet.permanentUrl,
                source: "twitter",
                inReplyTo: tweet.inReplyToStatusId
                    ? stringToUuid(tweet.inReplyToStatusId)
                    : undefined,
            } as Content;

            await this.runtime.messageManager.createMemory({
                id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
                userId,
                content: content,
                agentId: this.runtime.agentId,
                roomId,
                embedding: getEmbeddingZeroVector(),
                createdAt: tweet.timestamp * 1000,
            });

            await this.cacheTweet(tweet);
        }

        // Cache
        await this.cacheTimeline(timeline);
        await this.cacheMentions(mentionsAndInteractions.tweets);
    }

    async setCookiesFromArray(cookiesArray: any[]) {
        elizaLogger.debug("Setting cookies from array", {
            cookieCount: cookiesArray?.length || 0,
            hasValue: Boolean(cookiesArray[0]?.value),
        });

        // Handle case where cookies are nested in a value array
        const cookies = Array.isArray(cookiesArray[0]?.value)
            ? cookiesArray[0].value
            : cookiesArray;

        elizaLogger.debug("Processing cookies", {
            count: cookies?.length || 0,
        });

        const cookieStrings = cookies
            .map((cookie) => {
                // Ensure all required fields are present
                if (!cookie.key || !cookie.value) {
                    elizaLogger.warn(
                        "Invalid cookie format - missing key or value"
                    );
                    return null;
                }

                const cookieString = `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${
                    cookie.secure ? "Secure" : ""
                }; ${cookie.httpOnly ? "HttpOnly" : ""}; SameSite=${
                    cookie.sameSite?.toLowerCase() || "Lax"
                }`;

                elizaLogger.debug(`Processing cookie: ${cookie.key}`);
                return cookieString;
            })
            .filter(Boolean);

        if (cookieStrings.length === 0) {
            elizaLogger.warn("No valid cookies to set");
            return;
        }

        try {
            await this.twitterClient.setCookies(cookieStrings);
            elizaLogger.log(`Successfully set ${cookieStrings.length} cookies`);
        } catch (error) {
            elizaLogger.error("Error setting cookies:", error);
            throw error;
        }
    }

    async saveRequestMessage(message: Memory, state: State) {
        if (message.content.text) {
            const recentMessage = await this.runtime.messageManager.getMemories(
                {
                    roomId: message.roomId,
                    count: 1,
                    unique: false,
                }
            );

            if (
                recentMessage.length > 0 &&
                recentMessage[0].content === message.content
            ) {
                elizaLogger.debug("Message already saved", recentMessage[0].id);
            } else {
                await this.runtime.messageManager.createMemory({
                    ...message,
                    embedding: getEmbeddingZeroVector(),
                });
            }

            await this.runtime.evaluate(message, {
                ...state,
                twitterClient: this.twitterClient,
            });
        }
    }

    async loadLatestCheckedTweetId(): Promise<void> {
        const latestCheckedTweetId =
            await this.runtime.cacheManager.get<string>(
                `twitter/${this.profile.username}/latest_checked_tweet_id`
            );

        if (latestCheckedTweetId) {
            this.lastCheckedTweetId = BigInt(latestCheckedTweetId);
        }
    }

    async cacheLatestCheckedTweetId() {
        if (this.lastCheckedTweetId) {
            await this.runtime.cacheManager.set(
                `twitter/${this.profile.username}/latest_checked_tweet_id`,
                this.lastCheckedTweetId.toString()
            );
        }
    }

    async getCachedTimeline(): Promise<Tweet[] | undefined> {
        return await this.runtime.cacheManager.get<Tweet[]>(
            `twitter/${this.profile.username}/timeline`
        );
    }

    async cacheTimeline(timeline: Tweet[]) {
        await this.runtime.cacheManager.set(
            `twitter/${this.profile.username}/timeline`,
            timeline,
            { expires: Date.now() + 10 * 1000 }
        );
    }

    async cacheMentions(mentions: Tweet[]) {
        await this.runtime.cacheManager.set(
            `twitter/${this.profile.username}/mentions`,
            mentions,
            { expires: Date.now() + 10 * 1000 }
        );
    }

    async getCachedCookies(username: string) {
        elizaLogger.debug("Getting cached cookies for user:", username);

        try {
            const cookies = await this.runtime.cacheManager.get<any[]>(
                `twitter/${username}/cookies`
            );

            elizaLogger.debug("Retrieved cached cookies", {
                found: Boolean(cookies),
                count: cookies?.length || 0,
            });
            return cookies;
        } catch (error) {
            elizaLogger.error("Error getting cached cookies:", error);
            throw error;
        }
    }

    async cacheCookies(username: string, cookies: any[]) {
        elizaLogger.debug("Caching cookies for user:", username);

        const cookiesToCache = Array.isArray(cookies[0]?.value)
            ? cookies[0].value
            : cookies;

        elizaLogger.debug("Caching cookies", {
            count: cookiesToCache?.length || 0,
        });

        try {
            await this.runtime.cacheManager.set(
                `twitter/${username}/cookies`,
                cookiesToCache
            );
            elizaLogger.log("Successfully cached cookies");
        } catch (error) {
            elizaLogger.error("Error caching cookies:", error);
            throw error;
        }
    }

    async getCachedProfile(username: string) {
        return await this.runtime.cacheManager.get<TwitterProfile>(
            `twitter/${username}/profile`
        );
    }

    async cacheProfile(profile: TwitterProfile) {
        await this.runtime.cacheManager.set(
            `twitter/${profile.username}/profile`,
            profile
        );
    }

    async fetchProfile(username: string): Promise<TwitterProfile> {
        const cached = await this.getCachedProfile(username);

        if (cached) return cached;

        try {
            const profile = await this.requestQueue.add(async () => {
                const profile = await this.twitterClient.getProfile(username);
                // console.log({ profile });
                return {
                    id: profile.userId,
                    username,
                    screenName: profile.name || this.runtime.character.name,
                    bio:
                        profile.biography ||
                        typeof this.runtime.character.bio === "string"
                            ? (this.runtime.character.bio as string)
                            : this.runtime.character.bio.length > 0
                              ? this.runtime.character.bio[0]
                              : "",
                    nicknames:
                        this.runtime.character.twitterProfile?.nicknames || [],
                } satisfies TwitterProfile;
            });

            this.cacheProfile(profile);

            return profile;
        } catch (error) {
            console.error("Error fetching Twitter profile:", error);

            return undefined;
        }
    }
}
