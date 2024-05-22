import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../wba-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";
import { token_decimals } from "./spl_mint";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("4FHnUReHAwQ29wpjRxJCphWYyjKMsgiAzU94M1f1tCVx");

// Recipient address
const to = new PublicKey("DHBv8yCCngv9bhjB8kMWtjAP5Knnx16cFU9qqEJVkuMd");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromATA = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey);
        // Get the token account of the toWallet address, and if it does not exist, create it
        const toATA = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            to);

        // Transfer the new token to the "toTokenAccount" we just created
        const txid = await transfer(
            connection,
            keypair,
            fromATA.address,
            toATA.address,
            keypair,
            200n * token_decimals,
        );

        console.log(`Your transfer txid:\n ${txid}`);

        //Result:
        // https://explorer.solana.com/tx/54ARpEkEjsTEKbHZC2pUmTgMJAR3KzdoWPYf3VWf5vsJahmDoAxBDtdNMYvSeRCnFC2MXnpDfkSfnNAi4Ro53qsa?cluster=devnet

    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();