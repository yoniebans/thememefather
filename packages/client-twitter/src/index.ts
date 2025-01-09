import {
    IAgentRuntime,
    Client as ElizaClient,
    elizaLogger,
} from "@ai16z/eliza";
import {
    validateTwitterConfig,
    getPublishingConfig,
    getEngagementConfig,
} from "./environment.ts";
import { ClientBase } from "./base.ts";
import { TwitterPublishingService } from "./publishing.ts";
import { TwitterEngagementService } from "./engagement.ts";
import { EventEmitter } from "events";

export class TwitterClient extends EventEmitter {
    client: ClientBase;
    runtime: IAgentRuntime;
    publishingService: TwitterPublishingService;
    engagementService: TwitterEngagementService;

    constructor(runtime: IAgentRuntime) {
        super();
        this.runtime = runtime;
        this.client = new ClientBase(runtime);
    }

    async initialize() {
        elizaLogger.log("Initializing Twitter client");
        const config = await validateTwitterConfig(this.runtime);
        const publishingConfig = getPublishingConfig(config);
        const engagementConfig = getEngagementConfig(config);
        // Always initialize the client
        await this.client.init();

        // Only initialize and start services if enabled
        if (
            publishingConfig.enabledNormal ||
            publishingConfig.enabledLunarCrush
        ) {
            elizaLogger.log(
                "Initializing publishing service with config:",
                publishingConfig
            );
            this.publishingService = new TwitterPublishingService(
                this.client,
                this.runtime,
                publishingConfig
            );
            await this.publishingService.start();
            elizaLogger.success("Twitter publishing service started");
        } else {
            elizaLogger.info("Twitter publishing service disabled");
        }

        if (engagementConfig.enabled) {
            elizaLogger.log("Initializing engagement service");
            this.engagementService = new TwitterEngagementService(
                this.client,
                this.runtime,
                engagementConfig
            );
            await this.engagementService.start();
            elizaLogger.success("Twitter engagement service started");
        } else {
            elizaLogger.info("Twitter engagement service disabled");
        }

        elizaLogger.success("Twitter client initialized");
    }

    async stop() {
        elizaLogger.log("Stopping Twitter client");
        if (this.publishingService) {
            await this.publishingService.stop();
            elizaLogger.success("Twitter publishing service stopped");
        }
        if (this.engagementService) {
            await this.engagementService.stop();
            elizaLogger.success("Twitter engagement service stopped");
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
