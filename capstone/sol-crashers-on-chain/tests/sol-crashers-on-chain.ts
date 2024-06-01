import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolCrashersOnChain } from "../target/types/sol_crashers_on_chain";
import { PublicKey, Keypair } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
const TOKEN_2022_PROGRAM_ID = new anchor.web3.PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

describe("sol-crashers-on-chain", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolCrashersOnChain as Program<SolCrashersOnChain>;

  const payerPK = anchor.getProvider().publicKey;

  const [pda_mint] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("mint"),
      anchor.utils.bytes.utf8.encode("gold"),
    ],
    program.programId
  );

  it("airdrop payer", async () => {
    await anchor.getProvider().connection.confirmTransaction(
      await anchor.getProvider().connection.requestAirdrop(payerPK, 999999900000000000),
      "confirmed"
    );
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsStrict({
          payer: payerPK,
          mint: pda_mint,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
      .rpc({
        skipPreflight: true,
      });

    console.log("Transaction signature: %s", tx);
    console.log("Program ID:\t%s", program.programId.toBase58());
    console.log("Payer:\t\t%s", payerPK.toBase58());
    console.log("Mint Gems PK:\t%s", pda_mint.toBase58());
  });

  // it("Mints Gold" async () => {
  //   const tx = await program.rpc.mintGold({
  //     accounts: {
  //       authority: payer,
  //       mint: pda_mint,
  //       to: payer,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_2022_PROGRAM_ID,
  //     },
  //   });

  //   console.log("Your transaction signature", tx);
  // });
});
