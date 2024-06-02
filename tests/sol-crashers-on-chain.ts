import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolCrashersOnChain } from "../target/types/sol_crashers_on_chain";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, Account } from "@solana/spl-token";
import { assert } from "chai";

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

  const [pda_mint_gems] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint"),
      Buffer.from("gems"),
    ],
    program.programId
  );

  const bob_account = Keypair.generate();
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
      })
      .rpc({
        //skipPreflight: true,
      });

    console.log("Transaction signature: %s", tx);
    console.log("Payer:\t\t%s", payerPK.toBase58());
    console.log("Program ID:\t%s", program.programId.toBase58());
    console.log("Config PK:\t%s", pda_config.toBase58());
    console.log("Gold Mint PK:\t%s", pda_mint_gold.toBase58());
    console.log("Gems Mint PK:\t%s", pda_mint_gems.toBase58());
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

    bob_ata_gems = await getOrCreateAssociatedTokenAccount(
      anchor.getProvider().connection,
      bob_account,
      pda_mint_gems,
      pda_mint_gems,
      true,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_PROGRAM_ID
    );
    console.log("Gems Mint ATA Bob PK:\t%s", bob_ata_gems.address.toBase58());
  });
  
  it("Shop trade", async () => {

    let goldBalance:anchor.web3.TokenAmount;
    let gemBalance:anchor.web3.TokenAmount;

    // Print Bob's starting balance
    goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
    gemBalance = await (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
    console.log("Bob's initial balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

    // Trade on pair [0]
    await program.methods
    .shopTrade(0)
    .accounts({
      tokenAccountGold: bob_ata_gold.address,
      tokenAccountGems: bob_ata_gems.address,
    })
    .rpc({
      skipPreflight: true,
    });

    // Print Bob's updated balance
    goldBalance = (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gold.address)).value;
    gemBalance = await (await anchor.getProvider().connection.getTokenAccountBalance(bob_ata_gems.address)).value;
    console.log("Bob's updated balance:\t[Gems: %s] [Gold: %s]", gemBalance.amount, goldBalance.amount);

    // Trade on pair [1]
    await program.methods
    .shopTrade(1)
    .accounts({
      tokenAccountGold: bob_ata_gold.address,
      tokenAccountGems: bob_ata_gems.address,
    })
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
});
