interface RankingDetails {
    total: number;
    virality: number;
    relevance: number;
    uniqueness: number;
    longevity: number;
    reasoning: string;
    timestamp: number;
    marketContext:
        | string
        | {
              fearGreedIndex: string | number;
              volumeMetric: string | number;
              overallSentiment: string;
          };
    history: Array<{
        total: number;
        virality: number;
        relevance: number;
        uniqueness: number;
        longevity: number;
        timestamp: number;
    }>;
}
export interface DeploymentDetails {
    success: boolean;
    contractAddress: string;
    creator: string;
    tokenUrl: string;
    balance: number;
    initialInvestment: number;
}

export interface Meme {
    id: string;
    ticker: string;
    name: string;
    description: string;
    votes: number;
    author: string;
    timestamp: string;
    status: string;
    url?: string;
    ranking_details?: RankingDetails;
    deployment_details?: DeploymentDetails;
    deployment_timestamp?: number;
}
