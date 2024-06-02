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
      Buffer.from("co"),
    ],
    program.programId
  );
  console.log("Config PK:\t%s", pda_config.toBase58());
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
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsStrict({
        payer: payerPK,
        mint: pda_mint_gold,
        //config: pda_config,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc({
        skipPreflight: true,
      });

    console.log("Transaction signature: %s", tx);
    console.log("Program ID:\t%s", program.programId.toBase58());
    console.log("Config PK:\t%s", pda_config.toBase58());
    console.log("Payer:\t\t%s", payerPK.toBase58());
    console.log("Gold Mint PK:\t%s", pda_mint_gold.toBase58());
  });

  it("Create token accounts", async () => {
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

  it("Mint assets", async () => {

  });
});
