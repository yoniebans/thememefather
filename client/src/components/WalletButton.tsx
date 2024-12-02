import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

type PhantomProvider = {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    solana?: PhantomProvider;
};

declare global {
    interface Window {
        solana?: PhantomProvider;
    }
}

export function WalletButton() {
    const [phantom, setPhantom] = useState<PhantomProvider | null>(null);
    const { connected, setConnected, publicKey, setPublicKey } = useWallet();

    useEffect(() => {
        if ("solana" in window) {
            setPhantom(window.solana || null);
        }
    }, []);

    const connectWallet = async () => {
        try {
            const { solana } = window;

            if (solana) {
                const response = await solana.connect();
                const key = response.publicKey.toString();
                setPublicKey(key);
                setConnected(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const disconnectWallet = async () => {
        try {
            const { solana } = window;

            if (solana) {
                await solana.disconnect();
                setPublicKey(null);
                setConnected(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!phantom) {
        return (
            <Button
                variant="outline"
                onClick={() => window.open("https://phantom.app/", "_blank")}
                className="bg-purple-500 hover:bg-purple-600 text-white"
            >
                <Wallet className="h-4 w-4 mr-2" />
                Install Phantom
            </Button>
        );
    }

    return connected ? (
        <Button
            variant="outline"
            onClick={disconnectWallet}
            className="bg-purple-500 hover:bg-purple-600 text-white"
        >
            <Wallet className="h-4 w-4 mr-2" />
            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
        </Button>
    ) : (
        <Button
            variant="outline"
            onClick={connectWallet}
            className="bg-purple-500 hover:bg-purple-600 text-white"
        >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
        </Button>
    );
}
