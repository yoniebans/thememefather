import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

interface MemeModalProps {
    meme: {
        id: string;
        ticker: string;
        description: string;
        votes: number;
        author: string;
        timestamp: string;
        last_scored?: string;
        url?: string;
    };
    onClose: () => void;
}

export function MemeModal({ meme, onClose }: MemeModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-50 w-full max-w-2xl mx-4">
                <Card className="bg-black/80 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono">
                    <div className="p-6 space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-[#EC4899]">
                                    {meme.ticker}
                                </h2>
                                <p className="text-sm text-zinc-400">
                                    by {meme.author}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {/* Update Image URL */}
                            {meme.url && (
                                <div className="w-full">
                                    <img
                                        src={`${API_URL}${meme.url}`}
                                        alt="busto"
                                        className="w-full rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <div className="bg-black/50 p-4 rounded-lg">
                                <p className="text-zinc-200">
                                    {meme.description}
                                </p>
                            </div>

                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1 text-sm">
                                    <p className="text-zinc-500">
                                        created: {new Date(parseInt(meme.timestamp)).toLocaleDateString()}{" "}
                                        {new Date(parseInt(meme.timestamp)).toLocaleTimeString()}{" "}
                                        UTC
                                    </p>
                                    <p className="text-zinc-500">
                                        memetic scan: {meme.last_scored ? (
                                            `${new Date(parseInt(meme.last_scored)).toLocaleDateString()} ${new Date(parseInt(meme.last_scored)).toLocaleTimeString()} UTC`
                                        ) : (
                                            <span>soon<sup>™</sup></span>
                                        )}
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-green-500">
                                    {meme.votes.toString().padStart(3, '0')} mp
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
