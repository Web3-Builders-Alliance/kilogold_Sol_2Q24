import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VoteProgram } from "../target/types/vote_program";

describe("vote-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VoteProgram as Program<VoteProgram>;

  const url = "https://wba.dev";

  const voteAccount = anchor.web3.PublicKey.findProgramAddressSync([
    Buffer.from(url)
  ],program.programId)[0];

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
    .initialize(url)
    .accountsPartial({
      payer: provider.wallet.publicKey,
      voteAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    console.log("Your transaction signature", tx);

    let voteState = await program.account.voteState.fetch(voteAccount);
    console.log("\nYour vote score is", voteState.score.toString());
  });

  it("Upvote!", async() => {
    const tx = await program.methods
    .upvote(url)
    .accounts({
      voteAccount,
    })
    .rpc();
    console.log("Your transaction signature", tx);

    let voteState = await program.account.voteState.fetch(voteAccount);
    console.log("\nYour vote score is", voteState.score.toString());
  })
});
