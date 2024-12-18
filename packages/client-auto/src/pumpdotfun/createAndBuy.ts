import { AnchorProvider } from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { CreateTokenMetadata, PriorityFee, PumpFunSDK } from "pumpdotfun-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { IAgentRuntime } from "@ai16z/eliza";
import fs from "fs";
import { getWalletKey } from "./keypairUtils";

interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    image_url: string;
}

const MINIMUM_SOL = 0.004;
const DEFAULT_SLIPPAGE = "100"; // 1% in basis points

export const launchToken = async ({
    runtime,
    tokenMetadata,
    buyAmountSol,
}: {
    runtime: IAgentRuntime;
    tokenMetadata: TokenMetadata;
    buyAmountSol: string | number;
}) => {
    try {
        // Validate minimum SOL requirement
        const buyAmount = Number(buyAmountSol);
        if (buyAmount < MINIMUM_SOL) {
            throw new Error(
                `Buy amount must be at least ${MINIMUM_SOL} SOL for token creation`
            );
        }

        // Get wallet keypair using the utility function
        const { keypair: deployerKeypair } = await getWalletKey(runtime, true);

        if (!deployerKeypair) {
            throw new Error("Failed to get wallet keypair");
        }

        // Get RPC URL from runtime settings
        const rpcUrl = runtime.getSetting("RPC_URL");
        if (!rpcUrl) {
            throw new Error("RPC_URL not found in runtime settings");
        }

        // Get slippage from runtime settings or use default
        const slippage = runtime.getSetting("SLIPPAGE") || DEFAULT_SLIPPAGE;

        // Generate new mint keypair for the token
        const mintKeypair = Keypair.generate();
        console.log(
            `Generated mint address: ${mintKeypair.publicKey.toBase58()}`
        );

        // Read image file and convert to Blob
        const imageBuffer = fs.readFileSync(tokenMetadata.image_url);
        const imageBlob = new Blob([imageBuffer], { type: "image/png" });

        // Prepare token metadata
        const fullTokenMetadata: CreateTokenMetadata = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            description: tokenMetadata.description,
            file: imageBlob,
        };

        // Priority fee settings increased for better network priority
        const priorityFee: PriorityFee = {
            unitLimit: 1_000_000,
            unitPrice: 1_000_000,
        };

        // Setup connection with longer timeout and explicit confirmation settings
        const connection = new Connection(rpcUrl, {
            commitment: "confirmed",
            confirmTransactionInitialTimeout: 120_000, // 2 minutes
            wsEndpoint: rpcUrl.replace("https", "wss"),
        });

        const wallet = new Wallet(deployerKeypair);
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "finalized",
            preflightCommitment: "processed", // Allow faster preflight
            skipPreflight: false, // Keep preflight checks
            timeout: 180_000, // 3 minutes total timeout
        });
        const sdk = new PumpFunSDK(provider);

        // Convert SOL amount to lamports
        const lamports = Math.floor(buyAmount * 1_000_000_000);

        console.log(
            `Creating token with ${buyAmount} SOL and ${slippage} basis points slippage`
        );

        // Create and buy the token
        const createResults = await sdk.createAndBuy(
            deployerKeypair,
            mintKeypair,
            fullTokenMetadata,
            BigInt(lamports),
            BigInt(slippage),
            priorityFee,
            "finalized"
        );

        if (createResults.success) {
            const tokenUrl = `https://pump.fun/${mintKeypair.publicKey.toBase58()}`;
            console.log("Token created successfully:", tokenUrl);

            // Get token balance
            const ata = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                deployerKeypair.publicKey,
                false
            );
            const balance = await connection.getTokenAccountBalance(
                ata,
                "processed"
            );

            return {
                success: true,
                contractAddress: mintKeypair.publicKey.toBase58(),
                creator: deployerKeypair.publicKey.toBase58(),
                tokenUrl,
                balance: balance.value.uiAmount,
                initialInvestment: buyAmount,
            };
        } else {
            return {
                success: false,
                error: createResults.error || "Transaction failed",
                contractAddress: mintKeypair.publicKey.toBase58(),
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};
