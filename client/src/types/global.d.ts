interface Window {
    solana?: {
        connect(): Promise<{ publicKey: { toString(): string } }>;
        disconnect(): Promise<void>;
        isPhantom?: boolean;
        on(event: string, callback: () => void): void;
        off(event: string, callback: () => void): void;
    }
}

export { };