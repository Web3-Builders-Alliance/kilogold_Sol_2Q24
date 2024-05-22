import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import Solana from "@ledgerhq/hw-app-solana";
import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

// This is a mock of the Wallet class, which is used to sign transactions.
// Do not use this in prod. We are force casting legacy transactions, and this is not safe.
// For a safer approach, we should only cast transactions that are known to be legacy.
const firstAccountPathSolana = "44'/501'/0'";

export class LedgerWallet implements Wallet {
    publicKey: PublicKey;
        payer: Keypair;
        solana: Solana;

    constructor(publicKey: PublicKey, solana: Solana) {
        this.publicKey = publicKey;
        this.payer = Keypair.generate();
        this.solana = solana;
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {

        const legacy_txn = tx as Transaction;

        const {address} = await this.solana.getAddress(firstAccountPathSolana);
        legacy_txn.feePayer = new PublicKey(address);

        const {signature} = await this.solana.signTransaction(firstAccountPathSolana, legacy_txn.serializeMessage());
        
        legacy_txn.addSignature(legacy_txn.feePayer, signature);

        return legacy_txn as T;  // Cast back to the appropriate type
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        const results = [];
        for (const tx of txs) {
            const signedTx = await this.signTransaction(tx);  // Reuse signTransaction to handle each
            results.push(signedTx);
        }
        return results as T[];  // HACK: Ensure the return is cast to the correct type
    }
}

export async function getLedgerWallet(): Promise<Solana> {
    const transport = await TransportNodeHid.create();
    const ledger = new Solana(transport);
    return ledger;
}

export async function getLedgerWalletAddress(ledger: Solana): Promise<Buffer> {
    const {address} = await ledger.getAddress(firstAccountPathSolana);
    return address;
}