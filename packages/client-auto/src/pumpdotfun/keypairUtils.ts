import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { IAgentRuntime } from "@ai16z/eliza";

export interface KeypairResult {
    keypair?: Keypair;
    publicKey?: PublicKey;
}

/**
 * Gets either a keypair or public key based on runtime settings
 * @param runtime The agent runtime
 * @param requirePrivateKey Whether to return a full keypair (true) or just public key (false)
 * @returns KeypairResult containing either keypair or public key
 */
export async function getWalletKey(
    runtime: IAgentRuntime,
    requirePrivateKey: boolean = true
): Promise<KeypairResult> {
    if (requirePrivateKey) {
        const privateKeyString =
            runtime.getSetting("SOLANA_PRIVATE_KEY") ??
            runtime.getSetting("WALLET_PRIVATE_KEY");

        if (!privateKeyString) {
            throw new Error("Private key not found in settings");
        }

        try {
            // First try base58
            const secretKey = bs58.decode(privateKeyString);
            return { keypair: Keypair.fromSecretKey(secretKey) };
        } catch (error) {
            console.log("Failed to decode base58 key:", error);
            // Then try base64
            try {
                const secretKey = Uint8Array.from(
                    Buffer.from(privateKeyString, "base64")
                );
                return { keypair: Keypair.fromSecretKey(secretKey) };
            } catch (error2) {
                console.log("Failed to decode base64 key:", error2);
                throw new Error(
                    "Invalid private key format - must be base58 or base64"
                );
            }
        }
    } else {
        const publicKeyString =
            runtime.getSetting("SOLANA_PUBLIC_KEY") ??
            runtime.getSetting("WALLET_PUBLIC_KEY");

        if (!publicKeyString) {
            throw new Error("Public key not found in settings");
        }

        return { publicKey: new PublicKey(publicKeyString) };
    }
}
