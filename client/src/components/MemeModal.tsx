import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Meme } from "@/types/meme";

interface MemeModalProps {
    meme: Meme;
    onClose: () => void;
}

export function MemeModal({ meme, onClose }: MemeModalProps) {
    const [showHistory, setShowHistory] = useState(false);
    const formatScore = (score: number) => Math.round(score).toString();
    const hasRankingData = meme.ranking_details && meme.ranking_details.history?.length > 0;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/90 border border-zinc-800 p-3 rounded-lg shadow-xl">
                    <p className="text-zinc-400 text-xs mb-2">
                        {new Date(parseInt(label)).toLocaleString()}
                    </p>
                    {payload.map((entry: any) => (
                        <p key={entry.name} className="text-sm">
                            <span className="text-zinc-500">{entry.name}: </span>
                            <span style={{ color: entry.stroke }}>{formatScore(entry.value)}</span>
                        </p>
                    ))}
                    <div className="mt-1 pt-1 border-t border-zinc-800">
                        <p className="text-sm">
                            <span className="text-zinc-500">Total: </span>
                            <span className="text-[#EC4899]">{formatScore(payload[0].payload.total)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative flex">
                {/* Sliding history panel - Only render if we have ranking data */}
                {hasRankingData && (
                    <div
                        className={`absolute top-0 -right-96 h-full w-96 transition-transform duration-300 z-0 ${
                            showHistory ? 'translate-x-0' : 'translate-x-[-100%]'
                        }`}
                    >
                        <Card className="bg-black/90 border border-zinc-800 shadow-2xl text-white font-mono h-full">
                            <div className="p-6 space-y-4 h-full overflow-y-auto">
                                <div className="text-sm text-zinc-400">
                                    <p className="font-bold mb-2">Latest Analysis:</p>
                                    <p>{meme.ranking_details?.reasoning}</p>
                                </div>

                                <div>
                                    <p className="font-bold mb-2 text-sm text-zinc-400">Memetic Power Trend</p>
                                    <div className="h-48 w-full flex justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={[...meme.ranking_details!.history].sort((a, b) => a.timestamp - b.timestamp)}
                                                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                            >
                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                                                    stroke="#666"
                                                    fontSize={12}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                    angle={-30}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    domain={[0, 25]}
                                                    ticks={[0, 5, 10, 15, 20, 25]}
                                                    stroke="#666"
                                                    fontSize={12}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-10}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    name="Virality"
                                                    type="monotone"
                                                    dataKey="virality"
                                                    stroke="#3B82F6"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#3B82F6' }}
                                                />
                                                <Line
                                                    name="Relevance"
                                                    type="monotone"
                                                    dataKey="relevance"
                                                    stroke="#10B981"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#10B981' }}
                                                />
                                                <Line
                                                    name="Uniqueness"
                                                    type="monotone"
                                                    dataKey="uniqueness"
                                                    stroke="#F59E0B"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#F59E0B' }}
                                                />
                                                <Line
                                                    name="Longevity"
                                                    type="monotone"
                                                    dataKey="longevity"
                                                    stroke="#8B5CF6"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#8B5CF6' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="text-sm text-zinc-400">
                                    <p className="font-bold mb-2">Market Sentiment:</p>
                                    {typeof meme.ranking_details?.marketContext === 'string' ? (
                                        <p>{meme.ranking_details.marketContext}</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <p>Fear & Greed Index: {(meme.ranking_details?.marketContext as any).fearGreedIndex}</p>
                                            <p>Volume Metric: {(meme.ranking_details?.marketContext as any).volumeMetric}</p>
                                            <p>Overall Sentiment: {(meme.ranking_details?.marketContext as any).overallSentiment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Main modal - higher z-index */}
                <Card className="bg-black/90 border border-zinc-800 shadow-2xl text-white font-mono w-full max-w-2xl relative z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div className="p-6 space-y-4">
                        {/* Main content */}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">
                                <span className="text-green-500">
                                    {meme.votes.toString().padStart(3, '0')}
                                </span>
                                <span className="text-zinc-500 mx-2">|</span>
                                <span className="text-[#EC4899]">{meme.ticker}</span>
                            </h3>
                            <p className="text-zinc-400">{meme.description}</p>
                            <p className="text-sm text-zinc-500">by {meme.author}</p>
                            <p className="text-xs text-zinc-600">
                                created: {new Date(parseInt(meme.timestamp)).toLocaleDateString()}{" "}
                                {new Date(parseInt(meme.timestamp)).toLocaleTimeString()}
                            </p>
                        </div>

                        {/* Image section with conditional button */}
                        {meme.url && (
                            <div className="relative w-full">
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${meme.url}`}
                                    alt="Meme"
                                    className="w-full h-auto rounded-lg"
                                />
                                <Button
                                    variant="ghost"
                                    className={`absolute right-0 top-0 h-full w-8
                                        ${!hasRankingData
                                            ? 'bg-zinc-800/30 cursor-not-allowed'
                                            : showHistory
                                                ? 'bg-[#EC4899]/90 hover:bg-[#EC4899]'
                                                : 'bg-[#EC4899]/30 hover:bg-[#EC4899]/50'
                                        }`}
                                    onClick={() => hasRankingData && setShowHistory(!showHistory)}
                                    disabled={!hasRankingData}
                                >
                                    <span className="text-white text-xs rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                        {hasRankingData ? 'memetic power log' : 'scanning soon™'}
                                    </span>
                                </Button>
                            </div>
                        )}

                        {/* Metrics section - Only show if we have ranking data */}
                        {meme.ranking_details && (
                            <div className="space-y-4 pt-4 border-t border-zinc-800">
                                <p className="text-sm text-zinc-400 font-bold mb-2">Memetic Power Ranking</p>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    <div>
                                        <div className="text-green-500 text-lg">{formatScore(meme.ranking_details.total)}</div>
                                        <div className="text-xs text-zinc-500">Total</div>
                                    </div>
                                    <div>
                                        <div className="text-[#EC4899] text-lg">{formatScore(meme.ranking_details.virality)}</div>
                                        <div className="text-xs text-zinc-500">Virality</div>
                                    </div>
                                    <div>
                                        <div className="text-[#EC4899] text-lg">{formatScore(meme.ranking_details.relevance)}</div>
                                        <div className="text-xs text-zinc-500">Relevance</div>
                                    </div>
                                    <div>
                                        <div className="text-[#EC4899] text-lg">{formatScore(meme.ranking_details.uniqueness)}</div>
                                        <div className="text-xs text-zinc-500">Uniqueness</div>
                                    </div>
                                    <div>
                                        <div className="text-[#EC4899] text-lg">{formatScore(meme.ranking_details.longevity)}</div>
                                        <div className="text-xs text-zinc-500">Longevity</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
