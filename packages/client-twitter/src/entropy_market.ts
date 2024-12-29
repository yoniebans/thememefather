import { IAgentRuntime } from "@ai16z/eliza";
import { elizaLogger } from "@ai16z/eliza";
import { shuffle } from "lodash";

interface EnhancedMarketSentiment extends MarketSentiment {
    trendingCoins: string[];
    topGainersLosers: {
        gainers: Array<{ symbol: string; percentage: number }>;
        losers: Array<{ symbol: string; percentage: number }>;
    };
    globalMetrics: {
        activeCryptocurrencies: number;
        totalMarketCap: number;
        btcDominance: number;
        defiVolume: number;
    };
    categoryPerformance: Array<{
        name: string;
        marketCap: number;
        change24h: number;
    }>;
}

interface MarketSentiment {
    fearGreedIndex: number;
    volumeMetric: number;
    overallSentiment: number;
}

interface StyleMatrix {
    category: string;
    variations: Array<{
        template: string;
        weight: number;
        contexts?: string[];
    }>;
}

interface SentimentBasedTemplate {
    marketSignal: string;
    memeRef: string;
    authorityStance: string;
    weight: number;
}

interface WeightedReference {
    reference: string;
    weight: number;
}

export class CharacterEntropy {
    private runtime: IAgentRuntime;
    private styleMatrices: Record<string, StyleMatrix>;
    private lastMarketSentiment: MarketSentiment | null = null;
    private culturalReferences: WeightedReference[];

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.initializeStyleMatrices();
        this.initializeCulturalReferences();
    }

    private initializeCulturalReferences() {
        this.culturalReferences = [
            // Historical Events
            { reference: "mt gox incident", weight: 0.8 },
            { reference: "2018 winter", weight: 0.7 },
            { reference: "genesis block", weight: 0.6 },
            { reference: "pizza transaction", weight: 0.9 },
            { reference: "rare pepe vault", weight: 0.7 },
            { reference: "dao hack", weight: 0.8 },
            { reference: "bitconnect collapse", weight: 0.9 }, // Highly memeable
            { reference: "ethereum merge", weight: 0.7 },
            { reference: "silk road saga", weight: 0.8 },
            { reference: "crypto kitties congestion", weight: 0.6 },

            // Meme Events
            { reference: "bogdanoff twins", weight: 0.9 }, // Highly memeable
            { reference: "funds are safu", weight: 0.8 },
            { reference: "he sold? pump it", weight: 0.9 },
            { reference: "wassiewassie", weight: 0.7 },
            { reference: "dentacoin top 10", weight: 0.6 },

            // Community References
            { reference: "diamond hands", weight: 0.8 },
            { reference: "hodl typo", weight: 0.9 }, // Classic crypto lore
            { reference: "chad wojak", weight: 0.8 },
            { reference: "moon lambo", weight: 0.7 },
            { reference: "this is gentlemen", weight: 0.6 },

            // Technical Events
            { reference: "bitcoin halving", weight: 0.8 },
            { reference: "difficulty adjustment", weight: 0.6 },
            { reference: "segwit war", weight: 0.7 },
            { reference: "blocksize debate", weight: 0.7 },
            { reference: "eth gas wars", weight: 0.8 },

            // Market Events
            { reference: "$20k btc first time", weight: 0.8 },
            { reference: "black thursday crash", weight: 0.8 },
            { reference: "china ban #138", weight: 0.7 }, // Recurring meme
            { reference: "tesla bitcoin saga", weight: 0.7 },
            { reference: "ftx collapse", weight: 0.9 },

            // DeFi/NFT Lore
            { reference: "ape yacht club", weight: 0.8 },
            { reference: "defi summer", weight: 0.8 },
            { reference: "yield farming fever", weight: 0.7 },
            { reference: "nft right click", weight: 0.8 },
            { reference: "ens names rush", weight: 0.6 },
        ];
    }

    private getSentimentBasedTemplates(
        sentiment: MarketSentiment
    ): SentimentBasedTemplate[] {
        return [
            {
                marketSignal:
                    "[[RARE_PEPE_DETECTED]] extreme bullish divergence detected",
                memeRef: "wojak sentiment: maximum euphoria achieved",
                authorityStance:
                    "*checks green dildo strength* family gathering imminent",
                weight: sentiment.overallSentiment >= 80 ? 1.0 : 0.2,
            },
            {
                marketSignal: "[[MEME_CONVERGENCE]] bullish momentum building",
                memeRef: "rare pepe indicators: accumulation phase",
                authorityStance:
                    "*studies ancient charts* the family grows stronger",
                weight: sentiment.overallSentiment >= 60 ? 0.8 : 0.2,
            },
            {
                marketSignal:
                    "[[MARKET_CALIBRATION]] sideways wojak pattern forming",
                memeRef: "memetic convergence: consolidation phase",
                authorityStance:
                    "*consults the family* accumulation possibilities detected",
                weight:
                    sentiment.overallSentiment >= 40 &&
                    sentiment.overallSentiment < 60
                        ? 0.8
                        : 0.2,
            },
            {
                marketSignal: "[[WOJAK_PAIN_MAXIMUM]] capitulation incoming",
                memeRef: "copium reserves: critically low",
                authorityStance:
                    "*opens emergency ledger* family support levels tested",
                weight: sentiment.overallSentiment >= 20 ? 0.8 : 0.2,
            },
            {
                marketSignal: "[[MAXIMUM_PAIN]] wojak extinction event",
                memeRef: "despair metrics: astronomical",
                authorityStance:
                    "*activates ancestral buy walls* family protection protocol engaged",
                weight: sentiment.overallSentiment < 20 ? 1.0 : 0.2,
            },
        ];
    }

    private initializeStyleMatrices() {
        this.styleMatrices = {
            authority: {
                category: "authority",
                variations: [
                    {
                        template: "*adjusts rare pepe tie* attention bambinos",
                        weight: 0.7,
                    },
                    {
                        template:
                            "*opens ancient ledger* family gathering time",
                        weight: 0.6,
                    },
                    {
                        template:
                            "*calls emergency council* critical alpha detected",
                        weight: 0.8,
                    },
                ],
            },
            marketSignals: {
                category: "marketSignals",
                variations: [
                    {
                        template:
                            "[[RARE_PEPE_DETECTED]] bull market institutions incoming",
                        weight: 0.6,
                    },
                    {
                        template: "[[WOJAK_PAIN_MAXIMUM]] peak fud achieved",
                        weight: 0.7,
                    },
                    {
                        template: "[[MEME_CONVERGENCE]] momentum detected",
                        weight: 0.5,
                    },
                ],
            },
            memeReferences: {
                category: "memeReferences",
                variations: [
                    {
                        template: "wojak sentiment reaching critical mass",
                        weight: 0.8,
                    },
                    {
                        template: "rare pepe confluence at maximum",
                        weight: 0.7,
                    },
                    {
                        template: "memetic resonance peak detected",
                        weight: 0.6,
                    },
                ],
            },
        };
    }

    // Utility methods for random selection
    private selectWeightedItem<T extends { weight: number }>(items: T[]): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }

        return items[0];
    }

    private selectWeightedItems<T extends { weight: number }>(
        items: T[],
        count: number
    ): T[] {
        const selected: T[] = [];
        let remaining = [...items];

        for (let i = 0; i < count && remaining.length > 0; i++) {
            const chosen = this.selectWeightedItem(remaining);
            selected.push(chosen);
            remaining = remaining.filter((item) => item !== chosen);
        }

        return selected;
    }

    private selectRandomItems<T>(items: T[], count: number): T[] {
        return shuffle(items).slice(0, count);
    }

    private formatArrayAsNarrative(items: string[]): string {
        if (items.length === 0) return "";
        if (items.length === 1) return items[0];

        const lastItem = items[items.length - 1];
        const restItems = items.slice(0, -1);
        return `${restItems.join(", ")} and ${lastItem}`;
    }

    public async getMarketSentiment(): Promise<MarketSentiment> {
        try {
            const [cgResponse, fngResponse, historicalResponse] =
                await Promise.all([
                    fetch(
                        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_vol=true"
                    ),
                    fetch("https://api.alternative.me/fng/"),
                    fetch(
                        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily"
                    ),
                ]);

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

            const volumesBelow = historicalVolumes.filter(
                (v) => v < currentVolume
            ).length;
            const volumeMetric = Math.round(
                (volumesBelow / historicalVolumes.length) * 100
            );

            const overallSentiment = Math.round(
                fearGreedValue * 0.7 + volumeMetric * 0.3
            );

            this.lastMarketSentiment = {
                fearGreedIndex: fearGreedValue,
                volumeMetric,
                overallSentiment,
            };

            return this.lastMarketSentiment;
        } catch (error) {
            elizaLogger.error("Failed to fetch market sentiment:", error);
            return (
                this.lastMarketSentiment || {
                    fearGreedIndex: 50,
                    volumeMetric: 50,
                    overallSentiment: 50,
                }
            );
        }
    }

    private getMarketSentimentDescription(sentiment: MarketSentiment): string {
        if (sentiment.overallSentiment >= 80) return "peak euphoria";
        if (sentiment.overallSentiment >= 60)
            return "the family is eating well";
        if (sentiment.overallSentiment >= 40)
            return "a time of strategic accumulation";
        if (sentiment.overallSentiment >= 20) return "maximum wojak pain";
        return "the kind of fear that makes even rare pepes nervous";
    }

    public async getEnhancedMarketSentiment(): Promise<EnhancedMarketSentiment> {
        try {
            const [
                baseMetrics,
                trendingResponse,
                gainersLosersResponse,
                globalResponse,
                categoriesResponse,
            ] = await Promise.all([
                this.getMarketSentiment(),
                fetch("https://api.coingecko.com/api/v3/search/trending"),
                fetch(
                    "https://api.coingecko.com/api/v3/coins/top_gainers_losers"
                ),
                fetch("https://api.coingecko.com/api/v3/global"),
                fetch("https://api.coingecko.com/api/v3/coins/categories"),
            ]);

            const [trending, gainersLosers, global, categories] =
                await Promise.all([
                    trendingResponse.json(),
                    gainersLosersResponse.json(),
                    globalResponse.json(),
                    categoriesResponse.json(),
                ]);

            // Get top 3 trending coins
            const trendingCoins = trending.coins
                .slice(0, 3)
                .map((coin) => coin.item.symbol.toUpperCase());

            // Get top 3 gainers and losers
            const topGainersLosers = {
                gainers: gainersLosers.top_gainers.slice(0, 3).map((coin) => ({
                    symbol: coin.symbol.toUpperCase(),
                    percentage: coin.price_change_percentage_24h,
                })),
                losers: gainersLosers.top_losers.slice(0, 3).map((coin) => ({
                    symbol: coin.symbol.toUpperCase(),
                    percentage: coin.price_change_percentage_24h,
                })),
            };

            // Get top performing categories by 24h change
            const topCategories = categories
                .sort(
                    (a, b) => b.market_cap_change_24h - a.market_cap_change_24h
                )
                .slice(0, 3)
                .map((category) => ({
                    name: category.name,
                    marketCap: category.market_cap,
                    change24h: category.market_cap_change_24h,
                }));

            return {
                ...baseMetrics,
                trendingCoins,
                topGainersLosers,
                globalMetrics: {
                    activeCryptocurrencies: global.data.active_cryptocurrencies,
                    totalMarketCap: global.data.total_market_cap.usd,
                    btcDominance: global.data.market_cap_percentage.btc,
                    defiVolume: global.data.defi_volume_24h,
                },
                categoryPerformance: topCategories,
            };
        } catch (error) {
            elizaLogger.error(
                "Failed to fetch enhanced market sentiment:",
                error
            );
            return {
                ...(this.lastMarketSentiment || {
                    fearGreedIndex: 50,
                    volumeMetric: 50,
                    overallSentiment: 50,
                }),
                trendingCoins: [],
                topGainersLosers: { gainers: [], losers: [] },
                globalMetrics: {
                    activeCryptocurrencies: 0,
                    totalMarketCap: 0,
                    btcDominance: 0,
                    defiVolume: 0,
                },
                categoryPerformance: [],
            };
        }
    }

    private getEnhancedMarketSentimentDescription(
        sentiment: EnhancedMarketSentiment
    ): string {
        const baseDescription = this.getMarketSentimentDescription(sentiment);

        // Add trending coins context
        const trendingContext =
            sentiment.trendingCoins.length > 0
                ? `| trending: ${sentiment.trendingCoins.join(", ")}`
                : "";

        // Add top gainer context
        const topGainerContext =
            sentiment.topGainersLosers.gainers.length > 0
                ? `| chad of the day: ${sentiment.topGainersLosers.gainers[0].symbol} (${sentiment.topGainersLosers.gainers[0].percentage.toFixed(1)}%)`
                : "";

        // Add top loser context for maximum wojak
        const topLoserContext =
            sentiment.topGainersLosers.losers.length > 0
                ? `| maximum pain: ${sentiment.topGainersLosers.losers[0].symbol} (${sentiment.topGainersLosers.losers[0].percentage.toFixed(1)}%)`
                : "";

        // Add hot category context
        const hotCategoryContext =
            sentiment.categoryPerformance.length > 0
                ? `| hot sector: ${sentiment.categoryPerformance[0].name} (${sentiment.categoryPerformance[0].change24h.toFixed(1)}%)`
                : "";

        return `${baseDescription} ${trendingContext} ${topGainerContext} ${topLoserContext} ${hotCategoryContext}`.trim();
    }

    private async generateDynamicState() {
        const marketSentiment = await this.getMarketSentiment();
        const sentimentTemplates =
            this.getSentimentBasedTemplates(marketSentiment);
        const selectedSentiment = this.selectWeightedItem(sentimentTemplates);

        // Convert style.all items to weighted format
        const stances =
            this.runtime.character.style?.all.map((stance) => ({
                template: stance,
                weight: 1.0,
            })) || [];

        const currentStance = this.selectWeightedItem(stances).template;
        const additionalStyles = this.selectWeightedItems(
            Object.values(this.styleMatrices).flatMap(
                (matrix) => matrix.variations
            ),
            2
        );

        const culturalRef = this.selectWeightedItem(this.culturalReferences);

        const combinedStyles = [
            selectedSentiment.authorityStance,
            ...additionalStyles.map((style) => style.template),
        ].join(" | ");

        return {
            stance: currentStance,
            styles: combinedStyles,
            marketContext: `Current Market Sentiment: ${marketSentiment.overallSentiment}/100 | Volume: ${marketSentiment.volumeMetric}% | Fear&Greed: ${marketSentiment.fearGreedIndex}`,
            marketSentimentDescription:
                this.getMarketSentimentDescription(marketSentiment),
            memeReference: selectedSentiment.memeRef,
            culturalReference: culturalRef.reference,
        };
    }

    private async composeOverrideState() {
        const character = this.runtime.character;

        // Use non-weighted random selection for these arrays
        const selectedLore = this.selectRandomItems(
            character.lore || [],
            3
        ).join("\n");
        const selectedPostStyles = this.selectRandomItems(
            character.style?.post || [],
            3
        );
        const selectedAllStyles = this.selectRandomItems(
            character.style?.all || [],
            2
        );
        const selectedTopics = this.selectRandomItems(
            character.topics || [],
            3
        );
        const selectedExamples = this.selectRandomItems(
            character.postExamples || [],
            5
        );
        const selectedBio = Array.isArray(character.bio)
            ? this.selectRandomItems(character.bio, 3).join("\n")
            : character.bio || "";

        const dynamicState = await this.generateDynamicState();

        const topicsNarrative =
            selectedTopics.length > 0
                ? `${character.name} is interested in ${this.formatArrayAsNarrative(selectedTopics)}`
                : "";

        return {
            bio: selectedBio,
            lore: selectedLore,
            postDirections: [...selectedAllStyles, ...selectedPostStyles].join(
                "\n"
            ),
            characterPostExamples: selectedExamples.join("\n"),
            topics: topicsNarrative,
            ...dynamicState,
        };
    }

    public async getTwitterState() {
        return this.composeOverrideState();
    }
}
