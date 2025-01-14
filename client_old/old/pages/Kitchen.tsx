import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MemeModal } from "@/components/MemeModal";
import type { Meme } from "@/types/meme";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import cookingImage from "@/assets/whats_cooking.png";
import { getNextScanTime } from "@/utils/dates";
import { Footer } from "@/components/Footer";
const API_URL = import.meta.env.VITE_API_URL;

export function Kitchen() {
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

    const pendingMemes = memesData?.filter(meme => meme.status === "pending") || [];

    return (
        <main className="min-h-screen w-full">
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/restaurant_kitchen.png')] bg-cover bg-center bg-no-repeat bg-fixed">
                <Nav />

                <div className="w-full h-full">
                    <div className="container mx-auto px-4 pt-24">
                        <div className="mb-12">
                            <div className="mb-4">
                                <img
                                    src={cookingImage}
                                    alt="cooking"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <div className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden">
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
                                    <tbody>
                                        {pendingMemes.map((meme) => (
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