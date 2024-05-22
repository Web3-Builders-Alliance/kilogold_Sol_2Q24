import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../wba-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

export const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("4FHnUReHAwQ29wpjRxJCphWYyjKMsgiAzU94M1f1tCVx");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey);
        
        console.log(`Your ata is: ${ata.address.toBase58()}`);

        // Mint to ATA
         const mintTx = await mintTo(
            connection, 
            keypair,
            mint,
            ata.address,
            keypair,
            9001n * token_decimals);

         console.log(`Your mint txid: ${mintTx}`);

         //Result:
         // https://explorer.solana.com/tx/3kmtWpquZ45uMVMDxuSPU15vVwdZ3eZeXGgm52MC6xnZumhPKfhiNLaAMG5FTDk5fyF6p6TdnubJCJiw58ykxgVh?cluster=devnet
         
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
