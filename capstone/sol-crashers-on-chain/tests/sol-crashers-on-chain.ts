import * as anchor from "@coral-xyz/anchor";
import { SolCrashersOnChain } from "../target/types/sol_crashers_on_chain";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Signer } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getOrCreateAssociatedTokenAccount, Account } from "@solana/spl-token";
import { assert } from "chai";
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BN } from "bn.js";

function loadKeypairFromFile(filePath: string): Keypair {
    
    // Resolve home.
    if (filePath[0] === '~') {
        filePath = path.join(os.homedir(), filePath.slice(1));
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(__dirname, filePath);

    // Check if the file exists
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
    }

    // Read the id.json file
    const secretKeyString = fs.readFileSync(absolutePath, 'utf8');

    // Parse the secret key array
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

    // Create and return the Keypair
    return Keypair.fromSecretKey(secretKey);
}

const TOKEN_2022_PROGRAM_ID = new anchor.web3.PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);


// Load environment variables from .env file
dotenv.config();

// Step 1: Load the path to the id.json file from the .env file

describe("sol-crashers-on-chain", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolCrashersOnChain as anchor.Program<SolCrashersOnChain>;

    const payer = loadKeypairFromFile(process.env.KEYPAIR_PATH);
    const payerPK = payer.publicKey;

    const [pda_config] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("config"),
        ],
        program.programId
    );

    const [pda_shop] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("shop"),
        ],
        program.programId
    );

    const [pda_mint_gold] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("mint"),
            Buffer.from("gold"),
        ],
        program.programId
    );

    const [pda_mint_gold_metadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          pda_mint_gold.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const [pda_mint_gems] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("mint"),
            Buffer.from("gems"),
        ],
        program.programId
    );

    const [pda_mint_gems_metadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          pda_mint_gems.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const bob_account = loadKeypairFromFile(process.env.BOB_KEYPAIR_PATH);
    let bob_ata_gold: Account;
    let bob_ata_gems: Account;

    it("airdrop payer", async () => {
        await anchor.getProvider().connection.confirmTransaction(
            await anchor.getProvider().connection.requestAirdrop(payerPK, 900 * LAMPORTS_PER_SOL),
            "confirmed"
        );

        await anchor.getProvider().connection.confirmTransaction(
            await anchor.getProvider().connection.requestAirdrop(bob_account.publicKey, 100 * LAMPORTS_PER_SOL),
            "confirmed"
        );
    });

    it("Is initialized!", async () => {

        const tx = await program.methods
            .initialize()
            .accounts({
                payer: payerPK,
                config: pda_config,
                mintGold: pda_mint_gold,
                mintGems: pda_mint_gems,
                shopCatalog: pda_shop,
                rentProgram: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID, 
                metadataGems: pda_mint_gems_metadata,
                metadataGold: pda_mint_gold_metadata,                
            })
            .rpc({
                skipPreflight: true,
            });

        console.log("Transaction signature: %s", tx);
        console.log("Payer:\t\t%s", payerPK.toBase58());
        console.log("Bob:\t\t%s", bob_account.publicKey.toBase58());
        console.log("Program ID:\t%s", program.programId.toBase58());
        console.log("Config PK:\t%s", pda_config.toBase58());
        console.log("Gold Mint PK:\t%s", pda_mint_gold.toBase58());
        console.log("Gems Mint PK:\t%s", pda_mint_gems.toBase58());
        console.log("Shop Catalog PK:\t%s", pda_shop.toBase58());
    });

    it("Create token accounts", async () => {
        bob_ata_gold = await getOrCreateAssociatedTokenAccount(
            anchor.getProvider().connection,
            bob_account,            // payer
            pda_mint_gold,          // mint
            bob_account.publicKey,  // owner
            false,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_PROGRAM_ID
        );
        console.log("Gold Mint ATA Bob PK:\t%s", bob_ata_gold.address.toBase58());

        bob_ata_gems = await getOrCreateAssociatedTokenAccount(
            anchor.getProvider().connection,
            bob_account,
            pda_mint_gems,
            bob_account.publicKey,
            true,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_PROGRAM_ID
        );
        console.log("Gems Mint ATA Bob PK:\t%s", bob_ata_gems.address.toBase58());
    });

    it("Shop trade", async () => {

        let goldBalance: anchor.web3.TokenAmount;
        let gemBalance: anchor.web3.TokenAmount;

        // Print Bob's starting balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
        gemBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
        console.log("Bob's initial balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

        // Trade on pair [0]
        await program.methods
            .shopTrade(0)
            .accounts({
                tokenAccountGold: bob_ata_gold.address,
                tokenAccountGems: bob_ata_gems.address,
                tokenAccountsAuth: bob_account.publicKey,
                config: pda_config,
                shopCatalog: pda_shop,
                mintGems: pda_mint_gems,
                mintGold: pda_mint_gold,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([
                payer,
                bob_account
            ])
            .rpc({
                skipPreflight: true,
            });

        // Print Bob's updated balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
        gemBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
        console.log("Bob's updated balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

        // Trade on pair [1]
        await program.methods
            .shopTrade(1)
            .accounts({
                tokenAccountGold: bob_ata_gold.address,
                tokenAccountGems: bob_ata_gems.address,
                tokenAccountsAuth: bob_account.publicKey,
                config: pda_config,
                shopCatalog: pda_shop,
                mintGems: pda_mint_gems,
                mintGold: pda_mint_gold,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([
                payer,
                bob_account
            ])
            .rpc({
                skipPreflight: true,
            });

        // Print Bob's final balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
        gemBalance = await (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
        console.log("Bob's final balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

        assert.equal(Number(goldBalance.amount), 133);
        assert.equal(Number(gemBalance.amount), 20);

    });

    it("Burn some Gold", async () => {

        let goldBalance: anchor.web3.TokenAmount;
        let gemBalance: anchor.web3.TokenAmount;

        // Print Bob's starting balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;

        // Burn some Gold
        await program.methods
            .assetBurn(
                { gold: {} },
                new BN(3)
            )
            .accounts({
                tokenAccountGold: bob_ata_gold.address,
                tokenAccountGems: bob_ata_gems.address,
                tokenAccountsAuth: bob_account.publicKey,
                config: pda_config,
                shopCatalog: pda_shop,
                mintGems: pda_mint_gems,
                mintGold: pda_mint_gold,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([
                payer,
                bob_account
            ])
            .rpc({
                skipPreflight: true,
            });

        // Print Bob's updated balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
        gemBalance = await (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
        console.log("Bob's tweaked balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

        assert.equal(Number(goldBalance.amount), 130);
    });

    it("Boost Gems", async () => {
        let goldBalance: anchor.web3.TokenAmount;
        let gemBalance: anchor.web3.TokenAmount;

        // Print Bob's starting balance
        gemBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;

        // Boost Gems
        await program.methods
            .assetMint(
                { gems: {} },
                new BN(160)
            )
            .accounts({
                tokenAccountGold: bob_ata_gold.address,
                tokenAccountGems: bob_ata_gems.address,
                tokenAccountsAuth: bob_account.publicKey,
                config: pda_config,
                shopCatalog: pda_shop,
                mintGems: pda_mint_gems,
                mintGold: pda_mint_gold,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([
                payer,
                bob_account
            ])
            .rpc({
                skipPreflight: true,
            });

        // Print Bob's updated balance
        goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
        gemBalance = await (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
        console.log("Bob's tweaked balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

        assert.equal(Number(gemBalance.amount), 180);
    });
});
