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

        // Check if we're on HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.warn("[INIT] Wallet requires HTTPS connection");
            return;
        }

        const checkForPhantom = () => {
            console.log("[CHECK] Checking for Phantom wallet");
            // Check for both phantom.solana and window.solana
            if (window?.phantom?.solana || window.solana) {
                console.log("[CHECK] Found wallet provider");
                try {
                    setPhantom(window.phantom?.solana || window.solana || null);
                    console.log("[CHECK] Successfully set phantom state");
                } catch (err) {
                    console.error("[CHECK] Error setting phantom state:", err);
                }
                return;
            }
            // Retry for up to 10 seconds
            if (Date.now() - startTime < 10000) {
                console.log("[CHECK] Provider not found, will retry");
                setTimeout(checkForPhantom, 250);
            }
        };

        const startTime = Date.now();
        checkForPhantom();
    }, []);

    const connectWallet = async () => {
        console.log("[CONNECT] Starting wallet connection process");
        try {
            // Try phantom first, then fallback to solana
            const provider = window.phantom?.solana || window.solana || phantom;
            console.log("[CONNECT] Using provider:", provider);

            if (!provider) {
                console.log("[CONNECT] No wallet detected, redirecting to Phantom");
                window.open("https://phantom.app/", "_blank");
                return;
            }

            console.log("[CONNECT] Initiating connect() call");
            const response = await provider.connect();
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
