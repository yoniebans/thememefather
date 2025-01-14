import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
    publicKey: string | null;
    setPublicKey: (key: string | null) => void;
    connected: boolean;
    setConnected: (connected: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    return (
        <WalletContext.Provider
            value={{ publicKey, setPublicKey, connected, setConnected }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
