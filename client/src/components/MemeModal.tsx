import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const modalContainerRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const scrolling = useRef(false);

    const formatScore = (score: number) => Math.round(score).toString();
    const hasRankingData = meme.ranking_details && meme.ranking_details.history?.length > 0;

    const scrollToHistory = () => {
        if (!historyRef.current || scrolling.current) return;
        scrolling.current = true;
        historyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            scrolling.current = false;
        }, 300);
    };

    const scrollToTop = () => {
        if (!modalContainerRef.current || scrolling.current) return;
        scrolling.current = true;

        const container = modalContainerRef.current;
        const start = container.scrollTop;
        const startTime = performance.now();
        const duration = 300;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth deceleration
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            container.scrollTop = start * (1 - easeOutCubic);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scrolling.current = false;
            }
        };

        requestAnimationFrame(animate);
    };

    const handleToggleHistory = () => {
        if (!hasRankingData) return;

        const newShowHistory = !showHistory;
        setShowHistory(newShowHistory);

        if (newShowHistory) {
            setTimeout(scrollToHistory, 50);
        } else {
            scrollToTop();
        }
    };

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

    const modal = (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={modalContainerRef}
                className={`fixed inset-0 ${showHistory ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
            >
                <div className={`flex min-h-full items-center justify-center p-4 ${showHistory ? 'items-start' : ''}`}>
                    <div className="relative w-full max-w-2xl">
                        {/* Main modal */}
                        <Card className={`bg-black/90 border border-zinc-800 shadow-2xl text-white  w-full relative z-10 transition-transform duration-300 ${showHistory ? '-translate-y-4' : ''}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 z-10"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                            <div className="p-6 space-y-4">
                                {/* Header */}
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

                                {/* Image */}
                                {meme.url && (
                                    <div className="relative">
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${meme.url}`}
                                            alt="Meme"
                                            className="w-full h-auto max-h-[50vh] object-contain rounded-lg mx-auto"
                                        />
                                    </div>
                                )}

                                {/* Metrics */}
                                {meme.ranking_details && (
                                    <div className="pt-4 border-t border-zinc-800">
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

                                {/* Button */}
                                {hasRankingData && (
                                    <div>
                                        <Button
                                            variant="ghost"
                                            className={`w-full ${
                                                !hasRankingData
                                                    ? 'bg-zinc-800/30 cursor-not-allowed'
                                                    : showHistory
                                                        ? 'bg-[#EC4899]/30 hover:bg-[#EC4899]/50'
                                                        : 'bg-[#EC4899]/90 hover:bg-[#EC4899]'
                                            }`}
                                            onClick={handleToggleHistory}
                                            disabled={!hasRankingData}
                                        >
                                            {hasRankingData ? (showHistory ? 'Hide Memetic Power Log' : 'Show Memetic Power Log') : 'scanning soon™'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* History panel */}
                        {hasRankingData && (
                            <div
                                ref={historyRef}
                                className={`w-full transition-all duration-500 ${
                                    showHistory
                                        ? 'opacity-100 max-h-[2000px]'
                                        : 'opacity-0 pointer-events-none max-h-0 overflow-hidden'
                                }`}
                                style={{
                                    transitionProperty: 'all',
                                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <Card className="bg-black/90 border border-zinc-800 shadow-2xl text-white  w-full max-h-[60vh] overflow-y-auto">
                                    <div className="p-6 space-y-4">
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
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}