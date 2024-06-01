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

  const payer = Keypair.generate(); console.log("payer:", payer.publicKey.toBase58());

  const [pda_authority] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("gold"),
    ],
    program.programId
  );
  console.log("mint:", pda_authority.toBase58());


  it("airdrop payer", async () => {
    await anchor.getProvider().connection.confirmTransaction(
      await anchor.getProvider().connection.requestAirdrop(payer.publicKey, 99000000000000),
      "confirmed"
    );
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsStrict({
          payer: payer.publicKey,
          mint: pda_authority,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
      .signers([payer])
      .rpc();

    console.log("Your transaction signature", tx);
  });
});
