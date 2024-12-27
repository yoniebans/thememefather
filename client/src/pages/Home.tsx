import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import whatscookingImage from "@/assets/whats_cooking.png";
import { useState } from "react";
import { MemeModal } from "@/components/MemeModal";
import type { Meme } from "@/types/meme";
import theplugImage from "@/assets/the_plug.png";
import { Nav } from "@/components/Nav";
import { Link } from "react-router-dom";
import launchedImage from "@/assets/launched.png";
import { Footer } from "@/components/Footer";
import { getNextScanTime } from "@/utils/dates";
const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
    const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

    // Add memes query
    const { data: memesData, isLoading: memesLoading } = useQuery({
        queryKey: ["all-memes"],
        queryFn: async () => {
            const res = await fetch(
                `${API_URL}/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/memes`
            );
            const data = await res.json();
            return data.memes as Meme[];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
    // Get deployed memes, sorted by timestamp
    const deployedMemes = Array.isArray(memesData)
        ? memesData
            .filter(meme => meme.status === "deployed")
            .sort((a, b) => {
                const timestampA = a.deployment_timestamp ? new Date(a.deployment_timestamp).getTime() : 0;
                const timestampB = b.deployment_timestamp ? new Date(b.deployment_timestamp).getTime() : 0;
                return timestampB - timestampA;
            })
            .slice(0, 3)
        : [];

    // Fill remaining slots with placeholder cards
    const placeholderMeme: Meme = {
        id: 'placeholder',
        votes: 69,
        ticker: '???',
        author: 'wojak',
        status: 'deployed',
        deployment_timestamp: '2024-12-31',
    } as Meme;

    const displayedMemes = [
        ...deployedMemes,
        // Add only one placeholder if there's one real meme
        ...(deployedMemes.length === 1 ? [{ ...placeholderMeme, id: 'placeholder-0' }, null] :
            // Otherwise fill remaining slots with placeholders
            Array(Math.max(0, 3 - deployedMemes.length))
                .fill(null)
                .map((_, i) => ({ ...placeholderMeme, id: `placeholder-${i}` })))
    ];

    // Get cooking memes
    const cookingMemes = Array.isArray(memesData)
        ? memesData
            .filter(meme => meme.status === "pending")
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3)
        : [];

    // Create display array for cooking section with placeholders
    const displayedCookingMemes = [
        ...cookingMemes,
        ...Array(Math.max(0, 3 - cookingMemes.length))
            .fill(null)
            .map((_, i) => ({
                id: `cooking-placeholder-${i}`,
                isPlaceholder: true
            }))
    ];

    // Format memes for frontend
    const formattedMemes = cookingMemes?.map((meme) => (
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

    // Update these near the top of your Home component
    const nextLaunchDate = "31/12/2024";
    const nextScan = getNextScanTime();

    return (
        <main className="min-h-screen w-full">
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/background_v2.png')] bg-cover bg-center bg-no-repeat">
                <Nav />

                {/* The Plug Section - removed bg-black/95 and added pt-20 */}
                <div className="relative w-full flex flex-col">
                    <div className="w-full h-full py-16 pt-20">
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
                                            interactions {">"}
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
                                            ideation {">"}
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
                                            classification {">"}
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
                                            launch {">"}
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
                                            reset {">"}
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

                {/* What's Cooking section */}
                <div className="w-full h-full py-4">
                    <div className="container mx-auto px-4">
                        <div className="mb-4">
                            <img
                                src={whatscookingImage}
                                alt="vires in memeris"
                                className="h-12 w-auto"
                            />
                        </div>
                        {memesLoading ? (
                            <div className="grid gap-4 grid-cols-[1fr_1fr_1fr_32px]">
                                {Array(3).fill(0).map((_, i) => (
                                    <Card
                                        key={i}
                                        className="bg-black/70 border-zinc-800/50 shadow-xl"
                                    >
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
                                            <div className="h-3 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
                                        </div>
                                    </Card>
                                ))}
                                <div className="bg-[#EC4899] rounded-xl border-2 border-black" />
                            </div>
                        ) : cookingMemes?.length ? (
                            <div className="grid gap-4 grid-cols-[1fr_1fr_1fr_32px]">
                                {cookingMemes.map((meme) => (
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
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 ${meme.id.startsWith('placeholder') ? 'bg-orange-500' : 'bg-green-500'} rounded-full animate-pulse`} />
                                                    <span className={`text-xs ${meme.id.startsWith('placeholder') ? 'text-orange-500' : 'text-green-500'}`}>
                                                        {meme.id.startsWith('placeholder')
                                                            ? nextLaunchDate
                                                            : new Date(meme.deployment_timestamp ?? 0).toLocaleDateString()
                                                        }
                                                    </span>
                                                    {meme.status === 'deployed' && meme.deployment_details && (
                                                        <>
                                                            <span className="text-xs text-[#EC4899]">|</span>
                                                            <a
                                                                href={meme.deployment_details.tokenUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-400 hover:text-blue-300"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                View Token →
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {meme.url && !meme.id.startsWith('placeholder') && (
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
                                ))}
                                {Array(Math.max(0, 3 - cookingMemes.length)).fill(null).map((_, i) => (
                                    <Card
                                        key={`empty-${i}`}
                                        className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono"
                                    >
                                        {i === 0 && (
                                            <div className="p-4 space-y-1">
                                                <h3 className="text-lg font-semibold">
                                                    <span className="text-[#EC4899]">soon<sup>tm</sup></span>
                                                </h3>
                                                <p className="text-sm text-zinc-400">
                                                    come cook something with me in the{' '}
                                                    <Link
                                                        to="/office"
                                                        className="text-[#EC4899] hover:text-[#EC4899]/80 transition-colors"
                                                    >
                                                        office...
                                                    </Link>
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                                <Link
                                    to="/kitchen"
                                    className="bg-[#EC4899] hover:bg-[#DB2777]/90 transition-colors rounded-xl border-2 border-black flex items-center justify-center cursor-pointer"
                                >
                                    <span className="font-mono text-black font-medium -rotate-90">
                                        kitchen
                                    </span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-[1fr_1fr_1fr_32px]">
                                <div className="col-span-3 bg-black/70 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono rounded-lg p-8 text-center">
                                    <p className="text-xl mb-2">
                                        <span className="text-[#EC4899]">soon<sup>tm</sup></span>
                                    </p>
                                    <p className="text-zinc-400">
                                        ah my child, come cook something with me in the{' '}
                                        <Link
                                            to="/office"
                                            className="text-[#EC4899] hover:text-[#EC4899]/80 transition-colors"
                                        >
                                            office →
                                        </Link>
                                    </p>
                                </div>
                                <Link
                                    to="/office"
                                    className="bg-[#EC4899] hover:bg-[#DB2777]/90 transition-colors rounded-xl border-2 border-black flex items-center justify-center cursor-pointer"
                                >
                                    <span className="font-mono text-black font-medium -rotate-90">
                                        office
                                    </span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Launched section */}
                <div className="w-full h-full py-4">
                    <div className="container mx-auto px-4">
                        <div className="mb-4">
                            <img
                                src={launchedImage}
                                alt="launched"
                                className="h-12 w-auto"
                            />
                        </div>
                        <div className="grid gap-4 grid-cols-[1fr_1fr_1fr_32px]">
                            {displayedMemes.map((meme, index) => (
                                <Card
                                    key={meme?.id || `empty-${index}`}
                                    className="bg-black/70 backdrop-blur-sm border border-zinc-800/50 shadow-2xl text-white font-mono cursor-pointer transition-all hover:scale-[1.02]"
                                    onClick={() => meme && !meme.id.startsWith('placeholder') ? setSelectedMeme(meme) : null}
                                >
                                    {meme ? (
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
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 ${meme.id.startsWith('placeholder') ? 'bg-orange-500' : 'bg-green-500'} rounded-full animate-pulse`} />
                                                    <span className={`text-xs ${meme.id.startsWith('placeholder') ? 'text-orange-500' : 'text-green-500'}`}>
                                                        {meme.id.startsWith('placeholder')
                                                            ? nextLaunchDate
                                                            : new Date(meme.deployment_timestamp ?? 0).toLocaleDateString()
                                                        }
                                                    </span>
                                                    {meme.status === 'deployed' && meme.deployment_details && (
                                                        <>
                                                            <span className="text-xs text-[#EC4899]">|</span>
                                                            <a
                                                                href={meme.deployment_details.tokenUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-400 hover:text-blue-300"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                View Token →
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {meme.url && !meme.id.startsWith('placeholder') && (
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
                                    ) : null}
                                </Card>
                            ))}
                            <Link
                                to="/vault"
                                className="bg-[#EC4899] hover:bg-[#DB2777]/90 transition-colors rounded-xl border-2 border-black flex items-center justify-center cursor-pointer"
                            >
                                <span className="font-mono text-black font-medium -rotate-90">
                                    vault
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer
                nextScan={nextScan}
                nextLaunch={nextLaunchDate}
            />

            {selectedMeme && (
                <MemeModal
                    meme={selectedMeme}
                    onClose={() => setSelectedMeme(null)}
                />
            )}
        </main>
    );
}