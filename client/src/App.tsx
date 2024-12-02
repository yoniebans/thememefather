import "./App.css";
// import Agents from "./Agents";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowBigUp, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import eldonImage from "@/assets/eldon.png";
import { WalletButton } from '@/components/WalletButton';

type TextResponse = {
    text: string;
    user: string;
};

function App() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [loadingDots, setLoadingDots] = useState(".");

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(
                `/api/bfcb1db4-c738-0c4c-b9a2-b2e6247d6347/message`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                        userId: "user",
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

    return (
        <main className="min-h-screen w-full">
            {/* Chat Overlay */}
            {showChat && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-xl w-full max-w-2xl p-6 shadow-2xl border border-zinc-800">
                        <div className="min-h-[200px] mb-4 flex flex-col justify-center space-y-4">
                            {messages.length === 0 ? (
                                <p className="text-zinc-400 text-center">
                                    You come to me, on this day of maximum
                                    market volatility, asking for alpha?
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowChat(false)}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                                Close
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="min-h-screen relative w-full flex flex-col bg-[url('/src/assets/background.png')] bg-cover bg-center bg-no-repeat">
                {/* Social Links */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <WalletButton />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white rounded-xl"
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
                            className="bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-xl"
                            onClick={() => window.open("https://github.com/yoniebans/the_mf", "_blank")}
                        >
                            <Github className="h-4 w-4" />
                        </Button>
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

                            {/* Text and Button */}
                            <div className="text-center self-center">
                                <div className="flex gap-4 justify-center">
                                    <Button
                                        className="text-xl px-8 py-6 bg-pink-500 hover:bg-pink-600 rounded-xl font-bold shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
                                        onClick={() => setShowChat(true)}
                                    >
                                        SPEAK WITH THE FATHER
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner */}
                <div className="w-full overflow-hidden py-4 bg-black/10">
                    <div className="flex whitespace-nowrap animate-scroll">
                        {/* First set of items */}
                        {Array(10)
                            .fill("$THEMEMEFATHER")
                            .map((text, index) => (
                                <span
                                    key={`first-${index}`}
                                    className="text-2xl font-bold mx-8 text-white"
                                >
                                    {text}
                                </span>
                            ))}
                        {/* Duplicate set for seamless loop */}
                        {Array(10)
                            .fill("$THEMEMEFATHER")
                            .map((text, index) => (
                                <span
                                    key={`second-${index}`}
                                    className="text-2xl font-bold mx-8 text-white"
                                >
                                    {text}
                                </span>
                            ))}
                    </div>
                </div>
            </div>

            {/* Leaderboard Section */}
            <div className="min-h-screen bg-black py-20 w-full">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl md:text-6xl font-bold text-center mb-12 text-white">
                        Meme Leaderboard 🏆
                    </h2>
                    <div className="grid gap-6 max-w-2xl mx-auto">
                        {[
                            {
                                id: 1,
                                votes: 420,
                                title: "When you buy the dip but it keeps dipping",
                                author: "memeLord",
                            },
                            {
                                id: 2,
                                votes: 369,
                                title: "POV: Checking your portfolio in 2024",
                                author: "cryptoKing",
                            },
                            {
                                id: 3,
                                votes: 169,
                                title: "Web3 developers be like",
                                author: "blockchainBro",
                            },
                        ].map((meme) => (
                            <Card
                                key={meme.id}
                                className="p-4 bg-zinc-900 border-zinc-800"
                            >
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                    >
                                        <ArrowBigUp className="h-8 w-8" />
                                    </Button>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">
                                            {meme.title}
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            by {meme.author}
                                        </p>
                                    </div>
                                    <div className="text-xl font-bold text-green-500">
                                        {meme.votes}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default App;
