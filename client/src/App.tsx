import "./App.css";
// import Agents from "./Agents";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import eldonImage from "@/assets/eldon.png";
import { WalletButton } from "@/components/WalletButton";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import fontboltImage from "@/assets/fontbolt.png";

type TextResponse = {
    text: string;
    user: string;
};

interface Meme {
    id: string;
    ticker: string;
    description: string;
    votes: number;
    author: string;
    timestamp: string;
}

function AppContent() {
    const { connected, publicKey } = useWallet();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const [loadingDots, setLoadingDots] = useState(".");

    useEffect(() => {
        if (!connected) {
            setMessages([]);
        }
    }, [connected, publicKey]);

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            console.log("Sending message to server for user:", publicKey);
            const res = await fetch(
                `/api/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/message`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                        userId: publicKey,
                        roomId: "meme-generation-frontend",
                    }),
                }
            );
            return res.json() as Promise<TextResponse[]>;
        },
        onSuccess: (data) => {
            console.log(data);
            const newMessage = data[data.length - 1];
            setMessages((prev) => [...prev, newMessage].slice(-4));
        },
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (mutation.isPending) {
            interval = setInterval(() => {
                setLoadingDots((prev) => (prev === "..." ? "." : prev + "."));
            }, 500);
        }

        return () => clearInterval(interval);
    }, [mutation.isPending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const userMessage: TextResponse = {
            text: input,
            user: "user",
        };
        setMessages((prev) => [...prev, userMessage].slice(-4));

        mutation.mutate(input);
        setInput("");
    };

    // Add memes query
    const { data: memesData, isLoading: memesLoading } = useQuery({
        queryKey: ["memes"],
        queryFn: async () => {
            const res = await fetch(
                `/api/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/memes`
            );
            const data = await res.json();
            console.log(data);
            return data.memes as Meme[];
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Format memes for frontend
    const formattedMemes = memesData?.map((meme) => (
        <Card key={meme.id} className="backdrop-blur-sm bg-white/5 border-zinc-800/50 shadow-xl">
            <div className="p-4 flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[#EC4899] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                        {meme.ticker}
                    </h3>
                    <p className="text-sm text-zinc-400">by {meme.author}</p>
                    <p className="text-xs text-zinc-500">
                        {new Date(parseInt(meme.timestamp)).toLocaleDateString()} {new Date(parseInt(meme.timestamp)).toLocaleTimeString()} UTC
                    </p>
                </div>
                <div className="text-xl font-bold text-green-500">
                    {meme.votes}
                </div>
            </div>
        </Card>
    ));

    return (
        <main className="min-h-screen w-full">
            {/* Hero Section */}
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/background.png')] bg-cover bg-center bg-no-repeat">
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
                <div className="flex-1 flex items-end justify-start">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-start gap-20">
                            {/* Image */}
                            <div className="w-[800px] h-[800px] flex-shrink-0 -ml-10">
                                <img
                                    src={eldonImage}
                                    alt="El Don"
                                    className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                                    style={{
                                        imageRendering: "crisp-edges",
                                        WebkitBackdropFilter: "none",
                                        backdropFilter: "none",
                                    }}
                                />
                            </div>

                            {/* Chat Section - Only show when connected */}
                            {connected && (
                                <div className="w-[800px] h-[75vh] flex items-center">
                                    <div className="bg-zinc-900/90 rounded-xl w-full h-full p-6 shadow-2xl border border-zinc-800">
                                        <div className="h-[calc(100%-80px)] mb-4 flex flex-col justify-center space-y-4 overflow-y-auto">
                                            {messages.length === 0 ? (
                                                <p className="text-zinc-400 text-center">
                                                    You come to me, on this day of maximum market volatility, asking for alpha?
                                                </p>
                                            ) : (
                                                messages.map((message, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex ${
                                                            message.user === "user"
                                                                ? "justify-end"
                                                                : "justify-start"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                                message.user === "user"
                                                                    ? "bg-pink-500 text-white"
                                                                    : "bg-zinc-800 text-white"
                                                            }`}
                                                        >
                                                            {message.text}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {mutation.isPending && (
                                                <p className="text-zinc-400 text-center">
                                                    {loadingDots}
                                                </p>
                                            )}
                                        </div>

                                        <form onSubmit={handleSubmit} className="flex gap-2">
                                            <Input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Tell me, my child..."
                                                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                                                disabled={mutation.isPending}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={mutation.isPending}
                                                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold"
                                            >
                                                Send
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner */}
                <div className="w-full overflow-hidden py-4 bg-black/10">
                    <div className="flex whitespace-nowrap animate-scroll">
                        {/* Single set that gets duplicated by CSS */}
                        {memesData
                            ? [...Array(20)].map((_, index) => (
                                  <span
                                      key={index}
                                      className="text-2xl font-bold mx-8 text-[#EC4899] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]"
                                  >
                                      {memesData[index % memesData.length]
                                          ?.ticker || "$MEMEFATHER"}
                                  </span>
                              ))
                            : Array(20)
                                  .fill("$MEMEFATHER")
                                  .map((text, index) => (
                                      <span
                                          key={index}
                                          className="text-2xl font-bold mx-8 text-[#EC4899] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]"
                                      >
                                          {text}
                                      </span>
                                  ))}
                    </div>
                </div>
            </div>

            {/* Meme Leaderboard */}
            <div className="w-full overflow-hidden py-4 bg-black/10">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-4 text-[#EC4899] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                        veris in memeris
                    </h2>
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
