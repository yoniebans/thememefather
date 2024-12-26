import { IAgentRuntime } from "@ai16z/eliza";
import { z } from "zod";

export const twitterEnvSchema = z.object({
    TWITTER_DRY_RUN: z
        .string()
        .transform((val) => val.toLowerCase() === "true"),
    TWITTER_USERNAME: z.string().min(1, "Twitter username is required"),
    TWITTER_PASSWORD: z.string().min(1, "Twitter password is required"),
    TWITTER_EMAIL: z.string().email("Valid Twitter email is required"),
    TWITTER_COOKIES: z.string().optional(),
    TWITTER_2FA_SECRET: z.string().optional(),

    // Publishing config
    TWITTER_ALLOW_THREADS: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),
    TWITTER_PRESERVE_FORMATTING: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),
    TWITTER_MAX_LENGTH: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 280)),
    TWITTER_POST_INTERVAL_MIN: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 60)),
    TWITTER_POST_INTERVAL_MAX: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 90)),
    TWITTER_IMMEDIATE_FIRST_POST: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),

    // Engagement config
    TWITTER_TIMELINE_DEPTH: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 15)),
    TWITTER_ENGAGEMENT_INTERVAL: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 300000)), // 5 minutes default

    // Service control flags
    TWITTER_ENABLE_ENGAGEMENT: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),
    TWITTER_ENABLE_PUBLISHING_NORMAL: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),
    TWITTER_ENABLE_PUBLISHING_LUNAR_CRUSH: z
        .string()
        .optional()
        .transform((val) => val?.toLowerCase() === "true"),
    TWITTER_LUNAR_CRUSH_API_TOKEN: z.string().optional(),
});

export type TwitterConfig = z.infer<typeof twitterEnvSchema>;

export async function validateTwitterConfig(
    runtime: IAgentRuntime
): Promise<TwitterConfig> {
    try {
        const config = {
            TWITTER_DRY_RUN:
                runtime.getSetting("TWITTER_DRY_RUN") ||
                process.env.TWITTER_DRY_RUN ||
                "false",
            TWITTER_USERNAME:
                runtime.getSetting("TWITTER_USERNAME") ||
                process.env.TWITTER_USERNAME,
            TWITTER_PASSWORD:
                runtime.getSetting("TWITTER_PASSWORD") ||
                process.env.TWITTER_PASSWORD,
            TWITTER_EMAIL:
                runtime.getSetting("TWITTER_EMAIL") ||
                process.env.TWITTER_EMAIL,
            TWITTER_COOKIES:
                runtime.getSetting("TWITTER_COOKIES") ||
                process.env.TWITTER_COOKIES,
            TWITTER_2FA_SECRET:
                runtime.getSetting("TWITTER_2FA_SECRET") ||
                process.env.TWITTER_2FA_SECRET,
            // Publishing settings
            TWITTER_ALLOW_THREADS:
                runtime.getSetting("TWITTER_ALLOW_THREADS") ||
                process.env.TWITTER_ALLOW_THREADS,
            TWITTER_PRESERVE_FORMATTING:
                runtime.getSetting("TWITTER_PRESERVE_FORMATTING") ||
                process.env.TWITTER_PRESERVE_FORMATTING,
            TWITTER_MAX_LENGTH:
                runtime.getSetting("TWITTER_MAX_LENGTH") ||
                process.env.TWITTER_MAX_LENGTH,
            TWITTER_POST_INTERVAL_MIN:
                runtime.getSetting("TWITTER_POST_INTERVAL_MIN") ||
                process.env.TWITTER_POST_INTERVAL_MIN,
            TWITTER_POST_INTERVAL_MAX:
                runtime.getSetting("TWITTER_POST_INTERVAL_MAX") ||
                process.env.TWITTER_POST_INTERVAL_MAX,
            TWITTER_IMMEDIATE_FIRST_POST:
                runtime.getSetting("TWITTER_IMMEDIATE_FIRST_POST") ||
                process.env.TWITTER_IMMEDIATE_FIRST_POST,
            // Engagement settings
            TWITTER_TIMELINE_DEPTH:
                runtime.getSetting("TWITTER_TIMELINE_DEPTH") ||
                process.env.TWITTER_TIMELINE_DEPTH,
            TWITTER_ENGAGEMENT_INTERVAL:
                runtime.getSetting("TWITTER_ENGAGEMENT_INTERVAL") ||
                process.env.TWITTER_ENGAGEMENT_INTERVAL,
            // Add new service control flags
            TWITTER_ENABLE_ENGAGEMENT:
                runtime.getSetting("TWITTER_ENABLE_ENGAGEMENT") ||
                process.env.TWITTER_ENABLE_ENGAGEMENT ||
                "true", // Enable by default
            TWITTER_ENABLE_PUBLISHING_NORMAL:
                runtime.getSetting("TWITTER_ENABLE_PUBLISHING_NORMAL") ||
                process.env.TWITTER_ENABLE_PUBLISHING_NORMAL ||
                "true", // Enable by default
            TWITTER_ENABLE_PUBLISHING_LUNAR_CRUSH:
                runtime.getSetting("TWITTER_ENABLE_PUBLISHING_LUNAR_CRUSH") ||
                process.env.TWITTER_ENABLE_PUBLISHING_LUNAR_CRUSH ||
                "false", // Disable by default
            TWITTER_LUNAR_CRUSH_API_TOKEN:
                runtime.getSetting("TWITTER_LUNAR_CRUSH_API_TOKEN") ||
                process.env.TWITTER_LUNAR_CRUSH_API_TOKEN,
        };

        return twitterEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Twitter configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}

/**
 * Helper function to get publishing config from validated environment
 */
export function getPublishingConfig(config: TwitterConfig) {
    return {
        processingOptions: {
            allowThreads: config.TWITTER_ALLOW_THREADS ?? false,
            preserveFormatting: config.TWITTER_PRESERVE_FORMATTING ?? false,
            maxLength: config.TWITTER_MAX_LENGTH ?? 280,
        },
        postIntervalMin: config.TWITTER_POST_INTERVAL_MIN ?? 60,
        postIntervalMax: config.TWITTER_POST_INTERVAL_MAX ?? 90,
        immediateFirstPost: config.TWITTER_IMMEDIATE_FIRST_POST ?? false,
        dryRun: config.TWITTER_DRY_RUN ?? false,
        enabledNormal: config.TWITTER_ENABLE_PUBLISHING_NORMAL ?? true,
        enabledLunarCrush:
            config.TWITTER_ENABLE_PUBLISHING_LUNAR_CRUSH ?? false,
        lunarCrushApiToken: config.TWITTER_LUNAR_CRUSH_API_TOKEN,
    };
}

export function getEngagementConfig(config: TwitterConfig) {
    return {
        processingInterval: config.TWITTER_ENGAGEMENT_INTERVAL ?? 300000,
        timelineDepth: config.TWITTER_TIMELINE_DEPTH ?? 15,
        dryRun: config.TWITTER_DRY_RUN ?? false,
        enabled: config.TWITTER_ENABLE_ENGAGEMENT ?? true,
    };
}
