import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolCrashersOnChain } from "../target/types/sol_crashers_on_chain";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, Account } from "@solana/spl-token";

const TOKEN_2022_PROGRAM_ID = new anchor.web3.PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

describe("sol-crashers-on-chain", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolCrashersOnChain as Program<SolCrashersOnChain>;

  const payerPK = anchor.getProvider().publicKey;

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

  const bob_account = Keypair.generate();
  let bob_ata_gold: Account;

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
      })
      .rpc({
        skipPreflight: true,
      });

    console.log("Transaction signature: %s", tx);
    console.log("Payer:\t\t%s", payerPK.toBase58());
    console.log("Program ID:\t%s", program.programId.toBase58());
    console.log("Config PK:\t%s", pda_config.toBase58());
    console.log("Gold Mint PK:\t%s", pda_mint_gold.toBase58());
    console.log("Shop Catalog PK:\t%s", pda_shop.toBase58());
  });

  it("Create token accounts", async () => {
    //BUG: This isn't actually associating the token account with Bob. The seeds are wrong.
    //     We need to manually seed the token account to make this work.
    //     Current seeds are [mint, mint], instead of [mint, bob].
    bob_ata_gold = await getOrCreateAssociatedTokenAccount(
      anchor.getProvider().connection,
      bob_account,
      pda_mint_gold,
      pda_mint_gold,
      true,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_PROGRAM_ID
    );
    console.log("Gold Mint ATA Bob PK:\t%s", bob_ata_gold.address.toBase58());
  });
  
  it("Trade[0] assets", async () => {
    await program.methods
    .trade(0)
    .accounts({
      tokenAccountGold: bob_ata_gold.address,
    })
    .rpc({
      skipPreflight: true,
    });

    // Check bob_ata_gold token balance
    const balance = await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address);
    console.log("Bob's Gold balance: %s", balance.value.amount);
  });
});
