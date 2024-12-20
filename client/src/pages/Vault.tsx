import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MemeModal } from "@/components/MemeModal";
import type { Meme } from "@/types/meme";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import famigliaImage from "@/assets/famiglia.png";
import ngmiImage from "@/assets/ngmi.png";
import { Footer } from "@/components/Footer";
import { getNextScanTime } from "@/utils/dates";
const API_URL = import.meta.env.VITE_API_URL;

export function Vault() {
    const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
    const nextScan = getNextScanTime();

    const { data: memesData, isLoading } = useQuery({
        queryKey: ["all-memes"],
        queryFn: async () => {
            const res = await fetch(
                `${API_URL}/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/memes`
            );
            const data = await res.json();
            return data.memes as Meme[];
        },
    });

    const winners = memesData?.filter(meme => meme.status === "deployed") || [];
    const losers = memesData?.filter(meme => meme.status === "ngmi") || [];

    return (
        <main className="min-h-screen w-full bg-black/80">

            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/the_vault.png')] bg-cover bg-center bg-no-repeat bg-fixed">
                <Nav />

                <div className="w-full h-full bg-black/10">
                    <div className="container mx-auto px-4 pt-24">
                        {/* Winners Section with Deployment Details */}
                        <div className="mb-12">
                            <div className="mb-4">
                                <img
                                    src={famigliaImage}
                                    alt="winners"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {winners.map((meme) => (
                                    <div
                                        key={meme.id}
                                        className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono cursor-pointer transition-all hover:scale-[1.02] rounded-lg p-4"
                                        onClick={() => setSelectedMeme(meme)}
                                    >
                                        <div className="space-y-4">
                                            {/* Header with votes and ticker */}
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-semibold">
                                                        <span className="text-green-500">
                                                            {meme.votes.toString().padStart(3, '0')}
                                                        </span>
                                                        <span className="text-zinc-500 mx-2">|</span>
                                                        <span className="text-[#EC4899]">{meme.ticker}</span>
                                                    </h3>
                                                    <p className="text-sm text-zinc-400">by {meme.author}</p>
                                                </div>
                                                {meme.url && (
                                                    <div className="w-16 h-16 flex-shrink-0">
                                                        <img
                                                            src={`${API_URL}${meme.url}`}
                                                            alt="Meme"
                                                            className="w-full h-full object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Deployment Details */}
                                            {meme.status === 'deployed' && meme.deployment_details && (
                                                <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                                            <span className="text-xs text-green-500">
                                                                Deployed {new Date(meme.deployment_timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={meme.deployment_details.tokenUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-400 hover:text-blue-300"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View Token →
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* NGMI Section as Table */}
                        <div className="mb-12">
                            <div className="mb-4">
                                <img
                                    src={ngmiImage}
                                    alt="ngmi"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <div className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 rounded-lg">
                                <table className="w-full text-white font-mono">
                                    <thead className="border-b border-zinc-800/50">
                                        <tr>
                                            <th className="text-left p-4 text-[#EC4899]">memetic power</th>
                                            <th className="text-left p-4 text-[#EC4899]">ticker</th>
                                            <th className="text-left p-4 text-[#EC4899]">name</th>
                                            <th className="text-left p-4 text-[#EC4899]">description</th>
                                            <th className="text-left p-4 text-[#EC4899]">author</th>
                                            <th className="text-left p-4 text-[#EC4899]">last scan</th>
                                            <th className="text-left p-4 text-[#EC4899]">image</th>
                                            <th className="text-left p-4 text-[#EC4899]">action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="relative">
                                        {losers.map((meme) => (
                                            <tr
                                                key={meme.id}
                                                className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors"
                                            >
                                                <td
                                                    className="p-4 text-green-500 cursor-pointer whitespace-nowrap"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    {meme.votes.toString().padStart(3, '0')}
                                                </td>
                                                <td
                                                    className="p-4 text-[#EC4899] cursor-pointer whitespace-nowrap"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    {meme.ticker}
                                                </td>
                                                <td
                                                    className="p-4 text-zinc-300 cursor-pointer max-w-[200px]"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    <div className="truncate">
                                                        {meme.name || '-'}
                                                    </div>
                                                </td>
                                                <td
                                                    className="p-4 text-zinc-400 cursor-pointer max-w-[300px]"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    <div className="truncate">
                                                        {meme.description || '-'}
                                                    </div>
                                                </td>
                                                <td
                                                    className="p-4 text-zinc-400 cursor-pointer whitespace-nowrap"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    {meme.author}
                                                </td>
                                                <td
                                                    className="p-4 text-zinc-500 cursor-pointer whitespace-nowrap"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    {meme.ranking_details?.timestamp
                                                        ? new Date(meme.ranking_details.timestamp).toLocaleDateString()
                                                        : <span>soon<sup>tm</sup></span>
                                                    }
                                                </td>
                                                <td
                                                    className="p-4 cursor-pointer"
                                                    onClick={() => setSelectedMeme(meme)}
                                                >
                                                    {meme.url && (
                                                        <div className="w-12 h-12">
                                                            <img
                                                                src={`${API_URL}${meme.url}`}
                                                                alt="Meme"
                                                                className="w-full h-full object-cover rounded-lg"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="relative group">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black opacity-50 cursor-not-allowed"
                                                            disabled
                                                        >
                                                            audit
                                                        </Button>
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                                                            <div className="bg-black/70 backdrop-blur-sm text-[#EC4899] text-xs font-mono py-1 px-2 rounded whitespace-nowrap">
                                                                coming soon
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {selectedMeme && (
                <MemeModal
                    meme={selectedMeme}
                    onClose={() => setSelectedMeme(null)}
                />
            )}

            <Footer
                nextScan={nextScan}
                nextLaunch="31/12/2024"
            />
        </main>
    );
}