import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/WalletContext";

type Attachment = {
    id: string;
    url: string;
    source: string;
    description?: string;
    title?: string;
};

type TextResponse = {
    text: string;
    user: string;
    attachments?: Attachment[];
};

const formatPublicKey = (key: string | null): string => {
    if (!key) return "unknown";
    return `${key.slice(0, 4).toLowerCase()}...${key.slice(-4).toLowerCase()}`;
};

export default function Chat() {
    const { connected, publicKey } = useWallet();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const [loadingDots, setLoadingDots] = useState("");

    useEffect(() => {
        if (!connected) {
            setMessages([]);
        }
    }, [connected, publicKey]);

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
                        userId: publicKey,
                        roomId: "meme-generation-frontend",
                    }),
                }
            );
            const data = (await res.json()) as TextResponse[];
            return data;
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, ...data]);
            setLoadingDots("");
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
        if (!input.trim() || !publicKey) return;

        const userMessage: TextResponse = {
            text: input,
            user: publicKey,
        };
        setMessages((prev) => [...prev, userMessage]);

        mutation.mutate(input);
        setInput("");
    };

    return (
        <div className="w-[80%] h-[75vh] flex items-center">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg w-full h-full p-6 shadow-2xl border border-zinc-800/50 text-white font-mono">
                <div className="flex flex-col h-full">
                    {/* System Message */}
                    <div className="mb-4">
                        <p>
                            <span className="text-[#EC4899]">
                                meme_father {">"}{" "}
                            </span>
                            You come to me, on this day of maximum market
                            volatility, asking for alpha?
                        </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div key={index} className="mb-2">
                                <p>
                                    <span className="text-[#EC4899]">
                                        {message.user === publicKey
                                            ? formatPublicKey(message.user)
                                            : "meme_father"}{" "}
                                        {">"}{" "}
                                    </span>
                                    {message.text}
                                </p>
                            </div>
                        ))}
                        {mutation.isPending && (
                            <p>
                                <span className="text-[#EC4899]">
                                    meme_father {">"}{" "}
                                </span>
                                {loadingDots}
                            </p>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="flex items-center">
                        <span className="text-[#EC4899]">
                            {formatPublicKey(publicKey)} {">"}{" "}
                        </span>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
                            disabled={mutation.isPending}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
}
