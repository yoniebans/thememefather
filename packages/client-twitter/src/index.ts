import {
    IAgentRuntime,
    Client as ElizaClient,
    elizaLogger,
} from "@ai16z/eliza";
import { validateTwitterConfig, getPublishingConfig } from "./environment.ts";
import { ClientBase } from "./base.ts";
import { TwitterPublishingService } from "./publishing.ts";
import { EventEmitter } from "events";

export class TwitterClient extends EventEmitter {
    client: ClientBase;
    runtime: IAgentRuntime;
    publishingService: TwitterPublishingService;

    constructor(runtime: IAgentRuntime) {
        super();
        this.runtime = runtime;
        this.client = new ClientBase(runtime);
    }

    async initialize() {
        elizaLogger.log("Initializing Twitter client");
        const config = await validateTwitterConfig(this.runtime);
        const publishingConfig = getPublishingConfig(config);

        this.publishingService = new TwitterPublishingService(
            this.client,
            this.runtime,
            publishingConfig
        );

        await this.client.init();
        await this.publishingService.start();
        elizaLogger.success("Twitter client initialized");
    }

    async stop() {
        elizaLogger.log("Stopping Twitter client");
        if (this.publishingService) {
            await this.publishingService.stop();
            elizaLogger.success("Twitter publishing service stopped");
        }
    }
}

export const TwitterClientInterface: ElizaClient = {
    async start(runtime: IAgentRuntime) {
        await validateTwitterConfig(runtime);
        const client = new TwitterClient(runtime);
        await client.initialize();
        return client;
    },

    async stop(_runtime: IAgentRuntime) {
        elizaLogger.warn("Twitter client stop not implemented");
    },
};

export default TwitterClientInterface;

/**
 * Commented out legacy components for reference:
 *
 * - TwitterPostClient: Replaced by TwitterPublishingService
 * - TwitterSearchClient: Search functionality temporarily disabled
 * - TwitterInteractionClient: Interaction handling temporarily disabled
 *
 * Note: Search and interaction features were removed to focus on core posting
 * functionality and avoid potential rate limiting issues.
 */
