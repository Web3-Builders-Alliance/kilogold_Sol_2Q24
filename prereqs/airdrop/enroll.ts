import { Connection, PublicKey } from "@solana/web3.js"
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor"
import { WbaPrereq } from "./programs/wba_prereq";
import bs58 from 'bs58';
import { getLedgerWallet, getLedgerWalletAddress, LedgerWallet } from "./ledger";

(async () => {

    try {
        // We're going to import our keypair from a Ledger Wallet.
        const ledgerSolana = await getLedgerWallet();
        const address = await getLedgerWalletAddress(ledgerSolana);
        console.log("Ledger Public Key:", bs58.encode(address));

        // Create a devnet connection
        const connection = new Connection("https://api.devnet.solana.com");

        // Github account
        const github = Buffer.from("kilogold", "utf8");

        // Create our program
        const ledgerPubKey = new PublicKey(address);
        const ledgerWallet = new LedgerWallet(ledgerPubKey, ledgerSolana);
        const ledgerProvider = new AnchorProvider(connection, ledgerWallet);
        const program = new Program(WbaPrereq as Idl, ledgerProvider);

        // Create the PDA for our enrollment account
        const enrollment_seeds = [Buffer.from("prereq"), address];
        const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

        // Execute our enrollment transaction
        const txn = await program.methods
        .complete(github)
        .accounts({prereq: enrollment_key})
        .transaction();

        txn.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

        const signedTx = await ledgerWallet.signTransaction(txn);
        const txhash = await connection.sendRawTransaction(signedTx.serialize());

        console.log(`Success! Check out your TX here:
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
    
})();