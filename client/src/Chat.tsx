import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function Chat() {
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

        const userMessage: TextResponse = {
            text: input,
            user: "user",
        };
        setMessages((prev) => [...prev, userMessage]);

        mutation.mutate(input);
        setInput("");
    };

    return (
        <div className="w-[800px] h-[75vh] flex items-center">
            <div className="bg-zinc-900/90 rounded-xl w-full h-full p-6 shadow-2xl border border-zinc-800">
                <div className="h-[calc(100%-80px)] mb-4 flex flex-col justify-center space-y-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-zinc-400 text-center">
                            You come to me, on this day of maximum market
                            volatility, asking for alpha?
                        </p>
                    ) : (
                        messages.map((message, index) => {
                            return (
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
                                        {message.attachments?.map(
                                            (attachment) => {
                                                if (
                                                    attachment.source ===
                                                    "imageGeneration"
                                                ) {
                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="mt-2"
                                                        >
                                                            <img
                                                                src={
                                                                    attachment.url
                                                                }
                                                                alt={
                                                                    attachment.description ||
                                                                    "Generated image"
                                                                }
                                                                className="max-w-full rounded-lg"
                                                                onError={(e) =>
                                                                    console.error(
                                                                        "=== Image Load Error ===",
                                                                        attachment.url,
                                                                        e
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })
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
                        {mutation.isPending ? "..." : "Send"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
