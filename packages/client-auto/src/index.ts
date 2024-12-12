import {
    Client,
    IAgentRuntime,
    Memory,
    generateObjectDEPRECATED,
    elizaLogger,
    composeContext,
    ModelClass,
    stringToUuid,
} from "@ai16z/eliza";

interface MarketSentiment {
    fearGreedIndex: number;
    volumeMetric: number;
    overallSentiment: number;
}

interface RankingDetails {
    reasoning: string;
    timestamp: number;
    marketContext?: MarketSentiment;
    history?: Array<{
        total: number;
        virality: number;
        relevance: number;
        uniqueness: number;
        longevity: number;
        reasoning: string;
        timestamp: number;
        marketContext?: MarketSentiment;
    }>;
}

async function getMarketSentiment(): Promise<MarketSentiment> {
    try {
        // Fetch current data and historical data in parallel
        const [cgResponse, fngResponse, historicalResponse] = await Promise.all(
            [
                fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true"
                ),
                fetch("https://api.alternative.me/fng/"),
                fetch(
                    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily"
                ),
            ]
        );

        const [cgData, fngData, historicalData] = await Promise.all([
            cgResponse.json(),
            fngResponse.json(),
            historicalResponse.json(),
        ]);

        const currentVolume = cgData.bitcoin.usd_24h_vol;
        const fearGreedValue = parseInt(fngData.data[0].value);
        const historicalVolumes = historicalData.total_volumes.map(
            ([_, volume]) => volume
        );

        elizaLogger.info("Current 24h Volume:", currentVolume.toLocaleString());
        elizaLogger.info("Historical Volume Range:", {
            min: Math.min(...historicalVolumes).toLocaleString(),
            max: Math.max(...historicalVolumes).toLocaleString(),
            avg: (
                historicalVolumes.reduce((a, b) => a + b, 0) /
                historicalVolumes.length
            ).toLocaleString(),
        });

        // Calculate percentile of current volume compared to history
        const volumesBelow = historicalVolumes.filter(
            (v) => v < currentVolume
        ).length;
        const volumeMetric = Math.round(
            (volumesBelow / historicalVolumes.length) * 100
        );
        elizaLogger.info("Volume Metrics:", {
            volumesBelow,
            totalSamples: historicalVolumes.length,
            percentile: volumeMetric,
        });

        const overallSentiment = Math.round(
            fearGreedValue * 0.7 + volumeMetric * 0.3
        );
        elizaLogger.info("Sentiment Components:", {
            fearGreed: fearGreedValue,
            volumeMetric,
            overall: overallSentiment,
        });

        return {
            fearGreedIndex: fearGreedValue,
            volumeMetric,
            overallSentiment,
        };
    } catch (error) {
        elizaLogger.error("Failed to fetch market sentiment:", error);
        return {
            fearGreedIndex: 50,
            volumeMetric: 50,
            overallSentiment: 50,
        };
    }
}

function getSentimentDescription(sentiment: number): string {
    if (sentiment >= 80) return "Extremely Bullish";
    if (sentiment >= 60) return "Bullish";
    if (sentiment >= 40) return "Neutral";
    if (sentiment >= 20) return "Bearish";
    return "Extremely Bearish";
}

const rankTemplate = `
You are a ruthlessly honest crypto meme analyst. Your job is to evaluate memes with brutal honesty, comparing them against current market conditions and existing memes.

Meme Details:
Name: {{mr_name}}
Ticker: {{mr_ticker}}
Description: {{mr_description}}

Current Market Context:
- Fear & Greed Index: {{mr_market_fear_greed}}/100
- Market Sentiment: {{mr_market_sentiment}}
- Trading Activity: {{mr_market_volume}}% of normal volume

Recent Meme Rankings for Context:
{{mr_recent_rankings}}

Previous Scores for This Meme:
{{mr_previous_scores}}

Evaluation Framework:

1. Virality Potential (0-25):
- Initial impact (meme shock value)
- Share-worthiness
- Cross-platform potential
- Emotional triggers
- Current market sentiment alignment

2. Cultural Relevance (0-25):
- Crypto/Web3 cultural fit
- Market timing
- Community resonance
- Insider appeal
- Technical sophistication

3. Innovation Score (0-25):
- Concept originality
- Creative execution
- Meme evolution potential
- Pattern breaking
- Competition differentiation

4. Sustainability (0-25):
- Long-term narrative potential
- Adaptation capability
- Community building potential
- Market cycle resilience
- Evolution opportunities

Scoring Guidelines:
0-15: Failed concept
16-40: Weak potential
41-60: Average
61-80: Strong potential
81-90: Exceptional
91-100: Legendary

IMPORTANT:
- Be extremely critical
- Compare with existing memes
- Consider market timing
- Point out fatal flaws
- Evaluate against competitors

Respond with a JSON markdown block containing only the scores and detailed reasoning:
\`\`\`json
{
    "virality": <score 0-25>,
    "relevance": <score 0-25>,
    "uniqueness": <score 0-25>,
    "longevity": <score 0-25>,
    "total": <sum of scores>,
    "reasoning": "IMPORTANT: Keep this a single line with only basic punctuation. Avoid quotes and special characters."
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
                24 * 60 * 60 * 1000 // 24 hours in milliseconds
            );
        }, 30 * 1000); // 30 seconds delay
    }

    async rankPendingMemes() {
        try {
            elizaLogger.info("=== Starting meme ranking process ===");

            // Fetch market sentiment first
            const marketSentiment = await getMarketSentiment();
            elizaLogger.info("📊 Current market sentiment:", marketSentiment);

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

            // Rest of your existing setup code...
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

            const baseState = await this.runtime.composeState(baseMessage, {
                taskType: "meme_ranking",
                evaluationType: "memetic_potential",
            });

            // Fetch and process memes
            const pendingMemes = await memeManager.getMemories({
                roomId: this.runtime.agentId,
                count: 50,
                unique: true,
            });

            const memesToRank = pendingMemes.filter(
                (meme) => meme.content.status === "pending"
            );

            const shuffledMemes = [...memesToRank].sort(
                () => Math.random() - 0.5
            );

            // Get historical context
            const allMemes = await memeManager.getMemories({
                roomId: this.runtime.agentId,
                count: 100,
                unique: true,
            });

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
                .slice(0, 10);

            // Rank each meme
            for (const meme of shuffledMemes) {
                elizaLogger.info(
                    `\n=== Ranking meme: ${meme.content.ticker} ===`
                );

                const previousScores =
                    (meme.content.ranking_details as RankingDetails)?.history ||
                    [];
                const formattedPreviousScores = previousScores
                    .map(
                        (score) =>
                            `Score: ${score.total} (${new Date(score.timestamp).toISOString()}) - ${score.reasoning}`
                    )
                    .join("\n");

                const formattedRecentRankings = currentRoundScores
                    .map(
                        (score) =>
                            `${score.ticker}: ${score.score} - ${score.reasoning}`
                    )
                    .join("\n");

                // Create context with market data
                const context = composeContext({
                    state: {
                        ...baseState,
                        mr_name: meme.content.name,
                        mr_ticker: meme.content.ticker,
                        mr_description: meme.content.description,
                        mr_recent_rankings: formattedRecentRankings,
                        mr_previous_scores: formattedPreviousScores,
                        mr_market_fear_greed: marketSentiment.fearGreedIndex,
                        mr_market_sentiment: getSentimentDescription(
                            marketSentiment.overallSentiment
                        ),
                        mr_market_volume:
                            marketSentiment.volumeMetric.toFixed(1),
                    },
                    template: rankTemplate,
                });

                const ranking = await generateObjectDEPRECATED({
                    runtime: this.runtime,
                    context,
                    modelClass: ModelClass.SMALL,
                });

                // Update historical data
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
                    marketContext: marketSentiment,
                };

                // Update meme
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
                            ].slice(-5),
                        },
                    },
                    userId: meme.userId,
                    roomId: meme.roomId,
                    agentId: meme.agentId,
                    createdAt: meme.createdAt,
                };

                // Update scores for next iteration
                currentRoundScores.unshift({
                    ticker: meme.content.ticker,
                    score: ranking.total,
                    reasoning: ranking.reasoning,
                    timestamp: Date.now(),
                });
                currentRoundScores = currentRoundScores.slice(0, 10);

                // Save updates
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
