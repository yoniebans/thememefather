import "./App.css";
import { useQuery } from "@tanstack/react-query";
import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import fontboltImage from "@/assets/fontbolt.png";
import whatscookingImage from "@/assets/whats_cooking.png";
import theplugImage from "@/assets/the_plug.png";
import skylineImage from "@/assets/skyline_v2.png";
import { WalletButton } from "@/components/WalletButton";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import Chat from "./Chat";
import { useState } from "react";
import { MemeModal } from "@/components/MemeModal";
import { ScrollingBanner } from '@/components/ScrollingBanner';
const API_URL = import.meta.env.VITE_API_URL;
import type { Meme } from "@/types/meme";

function AppContent() {
    const { connected } = useWallet();
    const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

    // Add memes query
    const { data: memesData, isLoading: memesLoading } = useQuery({
        queryKey: ["memes"],
        queryFn: async () => {
            const res = await fetch(
                `${API_URL}/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/memes`
            );
            const data = await res.json();
            console.log("Received memes data:", data.memes);
            // Sort memes by votes in descending order
            const sortedMemes = data.memes.sort((a: Meme, b: Meme) => b.votes - a.votes);
            return sortedMemes as Meme[];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Format memes for frontend
    const formattedMemes = memesData?.map((meme) => (
        <Card
            key={meme.id}
            className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => setSelectedMeme(meme)}
        >
            <div className="p-4 flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                        <span className="text-green-500">
                            {meme.votes.toString().padStart(3, '0')}
                        </span>
                        <span className="text-zinc-500 mx-2">|</span>
                        <span className="text-[#EC4899]">{meme.ticker}</span>
                    </h3>
                    <p className="text-sm text-zinc-400">by {meme.author}</p>
                    <p className="text-xs text-zinc-500">
                        last scan:{' '}
                        {meme.ranking_details?.timestamp ? (
                            `${new Date(meme.ranking_details.timestamp).toLocaleDateString()} ${new Date(
                                meme.ranking_details.timestamp
                            ).toLocaleTimeString()} UTC`
                        ) : (
                            <>soon<sup>tm</sup></>
                        )}
                    </p>
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
        </Card>
    ));

    return (
        <main className="min-h-screen w-full bg-black/80">
            {/* Hero Section */}
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/background_v2.png')] bg-cover bg-center bg-no-repeat">
                {/* Logo and Social Links */}
                <div className="absolute top-4 w-full px-4 flex justify-between items-center">
                    {/* Logo */}
                    <img
                        src={fontboltImage}
                        alt="Logo"
                        className="h-12 w-auto"
                    />

                    {/* Social Links */}
                    <div className="flex items-center gap-2">
                        <WalletButton />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                                onClick={() =>
                                    window.open(
                                        "https://x.com/the_meme_father",
                                        "_blank"
                                    )
                                }
                            >
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
                                onClick={() =>
                                    window.open(
                                        "https://github.com/yoniebans/the_mf",
                                        "_blank"
                                    )
                                }
                            >
                                <Github className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center w-full">
                    <div className="w-full flex items-center justify-center">
                        {/* Chat Section - Only show when connected */}
                        {connected && <Chat />}
                    </div>
                </div>

                {/* Banner */}
                <ScrollingBanner memes={memesData} isLoading={memesLoading} />
            </div>

            {/* The Plug Section */}
            <div className="relative w-full flex flex-col bg-cover bg-center bg-no-repeat bg-black/95">
                <div className="w-full h-full backdrop-blur-sm bg-black/10 py-16">
                    <div className="container mx-auto px-4">
                        <div className="mb-4">
                            <img
                                src={theplugImage}
                                alt="the plug"
                                className="h-12 w-auto"
                            />
                        </div>
                        {/* Flowchart Container */}
                        <div className="relative flex flex-col items-center">
                            {/* Blob Container */}
                            <div className="w-full flex flex-wrap justify-between items-center gap-8 md:gap-4">
                                {/* Blob 1 - Interactions */}
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 shadow-2xl text-white font-mono p-6 rounded-lg w-64 relative">
                                    <h3 className="text-[#EC4899] mb-2">
                                        01_interactions {">"}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        web app console & twitter. the meme
                                        father acquires knowledge and ideas from
                                        interactions
                                    </p>
                                </div>

                                {/* Blob 2 - Ideation */}
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 shadow-2xl text-white font-mono p-6 rounded-lg w-64 relative">
                                    <h3 className="text-[#EC4899] mb-2">
                                        02_ideation {">"}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        the meme father spawns new memes into
                                        life. They go into the melting pot as
                                        candidates for launch
                                    </p>
                                </div>

                                {/* Blob 3 - Classification */}
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 shadow-2xl text-white font-mono p-6 rounded-lg w-64 relative">
                                    <h3 className="text-[#EC4899] mb-2">
                                        03_classification {">"}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        the meme father mulls over these ideas
                                        daily. he ranks them based on memetic
                                        power
                                    </p>
                                </div>

                                {/* Blob 4 - Launch */}
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 shadow-2xl text-white font-mono p-6 rounded-lg w-64 relative">
                                    <h3 className="text-[#EC4899] mb-2">
                                        04_launch {">"}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        every seventh day, he births a new meme
                                        on pump.fun and communicates via his
                                        channels
                                    </p>
                                </div>

                                {/* Blob 5 - Reset */}
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 shadow-2xl text-white font-mono p-6 rounded-lg w-64 relative">
                                    <h3 className="text-[#EC4899] mb-2">
                                        05_reset {">"}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        the slate is cleaned and the process
                                        repeats. Only the best memes make the
                                        cut
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meme Leaderboard */}
            <div
                className="min-h-screen relative w-full flex flex-col bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${skylineImage})` }}
            >
                <div className="w-full h-full backdrop-blur-sm bg-black/10 py-4">
                    <div className="container mx-auto px-4">
                        <div className="mb-4">
                            <img
                                src={whatscookingImage}
                                alt="vires in memeris"
                                className="h-12 w-auto"
                            />
                        </div>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {memesLoading
                                ? // Show loading skeletons
                                  Array(6)
                                      .fill(0)
                                      .map((_, i) => (
                                          <Card
                                              key={i}
                                              className="backdrop-blur-sm bg-white/5 border-zinc-800/50 shadow-xl"
                                          >
                                              <div className="p-4 space-y-3">
                                                  <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
                                                  <div className="h-3 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
                                              </div>
                                          </Card>
                                      ))
                                : formattedMemes}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedMeme && (
                <MemeModal
                    meme={selectedMeme}
                    onClose={() => setSelectedMeme(null)}
                />
            )}
        </main>
    );
}

export default function App() {
    return (
        <WalletProvider>
            <AppContent />
        </WalletProvider>
    );
}
