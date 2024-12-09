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
        phantom?: PhantomProvider;
    }
}

export function WalletButton() {
    const [phantom, setPhantom] = useState<PhantomProvider | null>(null);
    const { connected, setConnected, publicKey, setPublicKey } = useWallet();

    useEffect(() => {
        console.log("[INIT] Starting Phantom wallet detection");
        console.log("[INIT] window.solana:", window.solana);
        console.log("[INIT] window.phantom:", window?.phantom);

        const checkForPhantom = () => {
            console.log("[CHECK] Checking for Phantom wallet");
            if ("solana" in window) {
                console.log("[CHECK] Found window.solana:", window.solana);
                try {
                    setPhantom(window.solana || null);
                    console.log("[CHECK] Successfully set phantom state");
                } catch (err) {
                    console.error("[CHECK] Error setting phantom state:", err);
                }
                return;
            }
            console.log("[CHECK] Phantom not found, will retry");
            setTimeout(checkForPhantom, 1000);
        };

        checkForPhantom();
    }, []);

    const connectWallet = async () => {
        console.log("[CONNECT] Starting wallet connection process");
        try {
            const solana = window.solana || phantom;
            console.log("[CONNECT] Current solana object:", solana);
            console.log("[CONNECT] Solana methods:", Object.keys(solana || {}));

            if (!solana) {
                console.log("[CONNECT] No wallet detected, redirecting to Phantom");
                window.open("https://phantom.app/", "_blank");
                return;
            }

            console.log("[CONNECT] Checking connection status");
            try {
                // @ts-expect-error - Check if already connected
                const isConnected = solana.isConnected;
                console.log("[CONNECT] Current connection status:", isConnected);
            } catch (err) {
                console.log("[CONNECT] Error checking connection status:", err);
            }

            console.log("[CONNECT] Initiating connect() call");
            const response = await solana.connect();
            console.log("[CONNECT] Connect response:", response);

            const key = response.publicKey.toString();
            console.log("[CONNECT] Obtained public key:", key);

            setPublicKey(key);
            setConnected(true);
            console.log("[CONNECT] Successfully completed connection process");
        } catch (error) {
            console.error("[CONNECT] Connection error:", {
                error,
                name: (error as Error)?.name,
                message: (error as Error)?.message,
                stack: (error as Error)?.stack,
                type: typeof error,
                stringified: JSON.stringify(error, null, 2)
            });
        }
    };

    const disconnectWallet = async () => {
        console.log("[DISCONNECT] Starting wallet disconnection");
        try {
            const solana = window.solana || phantom;
            console.log("[DISCONNECT] Current solana object:", solana);

            if (solana) {
                console.log("[DISCONNECT] Calling disconnect()");
                await solana.disconnect();
                setPublicKey(null);
                setConnected(false);
                console.log("[DISCONNECT] Successfully disconnected");
            } else {
                console.log("[DISCONNECT] No wallet to disconnect");
            }
        } catch (error) {
            console.error("[DISCONNECT] Error during disconnection:", error);
        }
    };

    if (!phantom) {
        return (
            <Button
                variant="outline"
                onClick={() => window.open("https://phantom.app/", "_blank")}
                className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
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
            className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
        >
            <Wallet className="h-4 w-4 mr-2" />
            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
        </Button>
    ) : (
        <Button
            variant="outline"
            onClick={connectWallet}
            className="bg-[#EC4899] hover:bg-[#DB2777]/90 text-black rounded-xl border-2 border-black"
        >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
        </Button>
    );
}
