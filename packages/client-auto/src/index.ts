import {
    Client,
    IAgentRuntime,
    Memory,
    generateObject,
    elizaLogger,
    composeContext,
    ModelClass,
    stringToUuid,
} from "@ai16z/eliza";

interface RankingDetails {
    reasoning: string;
    timestamp: number;
    history?: Array<{
        total: number;
        virality: number;
        relevance: number;
        uniqueness: number;
        longevity: number;
        reasoning: string;
        timestamp: number;
    }>;
}

const rankTemplate = `
Given the following meme concept, evaluate its potential memetic power on a scale of 0-100 based on these criteria:

Meme Details:
Name: {{mr_name}}
Ticker: {{mr_ticker}}
Description: {{mr_description}}

Recent Meme Rankings for Context:
{{mr_recent_rankings}}

Previous Scores for This Meme:
{{mr_previous_scores}}

Evaluation Criteria:
1. Virality (0-25): How likely is it to spread rapidly?
2. Relevance (0-25): How well does it connect with crypto/web3 culture?
3. Uniqueness (0-25): How original and distinctive is the concept?
4. Longevity (0-25): Will it remain relevant beyond the immediate moment?

Consider how this meme compares to the recent rankings provided. Has its potential increased or decreased based on market conditions and competing memes?

Respond with a JSON markdown block containing only the scores and reasoning:
\`\`\`json
{
    "virality": 20,
    "relevance": 18,
    "uniqueness": 15,
    "longevity": 12,
    "total": 65,
    "reasoning": "Strong viral potential due to relatable humor, good cultural fit with DeFi themes, somewhat derivative of existing concepts, moderate staying power"
}
\`\`\`
`;

export class AutoClient {
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;

        // Initial run after 30 seconds
        setTimeout(async () => {
            await this.rankPendingMemes();

            // Then start a loop that runs every 4 hours
            this.interval = setInterval(
                async () => {
                    await this.rankPendingMemes();
                },
                4 * 60 * 60 * 1000 // 4 hours in milliseconds
            );
        }, 30 * 1000); // 30 seconds delay
    }

    async rankPendingMemes() {
        try {
            elizaLogger.info("=== Starting meme ranking process ===");
            const memeManager = this.runtime.getMemoryManager("memes");

            if (!memeManager) {
                elizaLogger.error("❌ Meme manager not found");
                return;
            }
            elizaLogger.info("✅ Meme manager loaded successfully");

            const roomId = stringToUuid(
                "meme_ranking_room-" + this.runtime.agentId
            );
            elizaLogger.debug("Generated room ID:", roomId);

            // Ensure user exists
            elizaLogger.info("Ensuring user exists...");
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                "meme_ranker",
                this.runtime.character.name,
                "auto"
            );
            elizaLogger.info("✅ User existence confirmed");

            // Create base message for state composition
            elizaLogger.info("Creating base message for state composition...");
            const baseMessage: Memory = {
                id: stringToUuid("meme-rank-base"),
                userId: this.runtime.agentId,
                roomId: roomId,
                agentId: this.runtime.agentId,
                content: {
                    text: "Ranking pending memes",
                    action: "RANK_MEME",
                },
                createdAt: Date.now(),
            };
            elizaLogger.debug("Base message created:", baseMessage);

            // Compose base state once
            elizaLogger.info("Composing base state...");
            const baseState = await this.runtime.composeState(baseMessage, {
                taskType: "meme_ranking",
                evaluationType: "memetic_potential",
            });
            elizaLogger.info("✅ Base state composed successfully");
            elizaLogger.debug("Base state details:", baseState);

            // Fetch pending memes
            elizaLogger.info("Fetching pending memes...");
            const pendingMemes = await memeManager.getMemories({
                roomId: this.runtime.agentId,
                count: 50,
                unique: true,
            });
            elizaLogger.info(`Retrieved ${pendingMemes.length} total memes`);

            // Filter for pending status
            const memesToRank = pendingMemes.filter(
                (meme) => meme.content.status === "pending"
            );
            elizaLogger.info(
                `📊 Found ${memesToRank.length} pending memes to rank`
            );

            // Randomize the order of memes to rank
            const shuffledMemes = [...memesToRank].sort(
                () => Math.random() - 0.5
            );
            elizaLogger.info(
                `📊 Randomized ${shuffledMemes.length} memes for ranking`
            );

            // Get historical context of all memes (including previously ranked)
            const allMemes = await memeManager.getMemories({
                roomId: this.runtime.agentId,
                count: 100,
                unique: true,
            });

            // Build scoring context that will be updated during the ranking loop
            let currentRoundScores = allMemes
                .filter(
                    (meme) =>
                        (meme.content.ranking_details as RankingDetails)
                            ?.timestamp
                )
                .map((meme) => ({
                    ticker: meme.content.ticker,
                    score: meme.content.votes,
                    reasoning: (meme.content.ranking_details as RankingDetails)
                        .reasoning,
                    timestamp: (meme.content.ranking_details as RankingDetails)
                        .timestamp,
                }))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10); // Keep only 10 most recent rankings

            // Rank each meme
            for (const meme of shuffledMemes) {
                elizaLogger.info(
                    `\n=== Ranking meme: ${meme.content.ticker} ===`
                );

                // Format previous scores for this meme
                const previousScores =
                    (meme.content.ranking_details as RankingDetails)?.history ||
                    [];
                const formattedPreviousScores = previousScores
                    .map(
                        (score) =>
                            `Score: ${score.total} (${new Date(score.timestamp).toISOString()}) - ${score.reasoning}`
                    )
                    .join("\n");

                // Format recent rankings
                const formattedRecentRankings = currentRoundScores
                    .map(
                        (score) =>
                            `${score.ticker}: ${score.score} - ${score.reasoning}`
                    )
                    .join("\n");

                // Create context with historical data
                const context = composeContext({
                    state: {
                        ...baseState,
                        mr_name: meme.content.name,
                        mr_ticker: meme.content.ticker,
                        mr_description: meme.content.description,
                        mr_recent_rankings: formattedRecentRankings,
                        mr_previous_scores: formattedPreviousScores
                    },
                    template: rankTemplate,
                });

                const ranking = await generateObject({
                    runtime: this.runtime,
                    context,
                    modelClass: ModelClass.SMALL,
                });

                // Prepare historical data
                const previousHistory =
                    (meme.content.ranking_details as RankingDetails)?.history ||
                    [];
                const newHistoryEntry = {
                    total: ranking.total,
                    virality: ranking.virality,
                    relevance: ranking.relevance,
                    uniqueness: ranking.uniqueness,
                    longevity: ranking.longevity,
                    reasoning: ranking.reasoning,
                    timestamp: Date.now(),
                };

                // Update meme with new ranking and history
                const updatedMeme: Memory = {
                    id: meme.id,
                    content: {
                        ...meme.content,
                        votes: ranking.total,
                        ranking_details: {
                            ...newHistoryEntry,
                            history: [
                                ...previousHistory,
                                newHistoryEntry,
                            ].slice(-5), // Keep last 5 rankings
                        },
                    },
                    userId: meme.userId,
                    roomId: meme.roomId,
                    agentId: meme.agentId,
                    createdAt: meme.createdAt,
                };

                // Update the current round scores for next meme's context
                currentRoundScores.unshift({
                    ticker: meme.content.ticker,
                    score: ranking.total,
                    reasoning: ranking.reasoning,
                    timestamp: Date.now(),
                });
                currentRoundScores = currentRoundScores.slice(0, 10); // Keep only 10 most recent

                // Update meme in storage
                await memeManager.removeMemory(meme.id);
                await memeManager.createMemory(updatedMeme, true);
                elizaLogger.info(
                    `✅ Meme ${meme.content.ticker} updated successfully`
                );
            }

            elizaLogger.info(
                "🎉 Successfully completed ranking all pending memes"
            );
        } catch (error) {
            elizaLogger.error("❌ Error during meme ranking process:", error);
            elizaLogger.error("Stack trace:", error.stack);
        }
    }
}

export const AutoClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new AutoClient(runtime);
        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        console.warn("Auto client does not support stopping yet");
    },
};

export default AutoClientInterface;
