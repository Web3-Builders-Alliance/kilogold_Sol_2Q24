# Solana Crashers On-Chain
This is the on-chain counterpart for a [modified version of Dragon Crashers](https://github.com/kilogold/SolanaCrashers)

# Tests (WIP):
* Contract deployment.
* Gold operations.
* Gem operations.

# Deployment Layout
All tokens are (for now) meant to be under control of the token program.
We are modeling a closed-loop economy. We can revisit later as an open-loop economy.
```mermaid
flowchart TD

            direction LR
            program("SolCrash Program
                Signer Seed: 'solcrash'"
            )
            
            goldMint["
                GOLD MINT ACCT
                Mint Auth: solcrash
                Close Auth: solcrash
                Perm Delegate: solcrash
                Metadata: Gold Mint
                NonTransferable
            "]
            
            goldATA_Bob["Bob Gold ATA
                Auth: Bob Acct"
            ]
            
            gemMint["
                GEM MINT ACCT
                Mint Auth: solcrash
                Close Auth: solcrash
                Perm Delegate: solcrash
                Metadata: Gem Mint
                NonTransferable
            "]
            
            gemATA_Bob["Bob Gem ATA
                Auth: Bob Acct"
            ]

            goldMint ---->|"[PDA]"| goldATA_Bob
            gemMint --[PDA]--> gemATA_Bob

            direction LR
            accountB["Bob Acct"]
            accountB -.->|"mint_gold(amount)"| program  
            program -.->|"mint(GOLD MINT ACCT)"| Token22
            Token22 -.->|balance increase| goldATA_Bob
```
## Token Extensions used
* **Close Authority**: For clean-up (in an unforsseable future).
* **Metadata**: Embedding token info into the Mint.
* **Non-Transferable**: Assets won't be traded in secondary markets.
## Caveats
* `SolCrash Program` will be the Mint (and Burn) authority for these assets. No need to use `Permanent Delegate` extension, because assets are `Non-Transferable`.
  * __THIS IS WRONG!!!__ Burn is only possible by authority. We may need `Permanent Delegate` afterall...
* To accelerate development, we'll let players be authority over ATA. They should not be messing with it directly.
  * TODO: Restrict player authority by setting `SolCrash Program` as the authority, and wrapping instructions as CPI's.

# Instructions
## Initialize Solana Crashers
```mermaid
sequenceDiagram
    participant Dev as Dev Account
    participant SolCrash as SolCrash Program
    participant Token22Prog as Token22 Program
    participant SysProg as System Program
    participant GoldMint as Gold Mint Account
    participant GemMint as Gem Mint Account
    
    Dev->>SolCrash: initialize
    SolCrash->>SysProg: init PDA 'GoldMint'
    SysProg->>SysProg: transfer_lamports(payer, GoldMint) rent-exemption.
    SolCrash->>Token22Prog: init_token_mint(GoldMint)
    SysProg->>SysProg: [HACK]transfer_lamports(payer, GoldMint) cover init_token_metadata cost.
    SolCrash->>Token22Prog: init_token_metadata(GoldMint)
    SolCrash->>GoldMint: reload(), account size changed.
    SolCrash->>GoldMint: transfer_lamports(payer, GoldMint) rent top-up.

```

## Register player
```mermaid
sequenceDiagram
    participant Bob as Bob
    participant Unity as Unity Client
    participant Wallet as Wallet
    participant SolCrash as SolCrash Program
    participant Token22Prog as Token22 Program

    Bob ->> Unity: Sign up
    Unity ->> Wallet: Sign Txn(Registration)
    Wallet -->> Bob: Sign prompt
    Bob ->> Wallet: Accept signing request
    Wallet ->> SolCrash: Txn[Register(Bob Acct)]
    SolCrash ->> Token22Prog: CreateATA(GoldMint)
    SolCrash ->> Token22Prog: CreateATA(GemMint)
    SolCrash -->> Unity: Txn details
    Unity ->> Unity: Transition to Dashboard
```

# FAQ
**Why use Token Accounts instead of storing all player data in a single account?**  
This way some aspects of the game are readily indexed by blockchain scanners, as it adheres to typical token standards.

# Dev Log
* Anchor ^0.30.0 supports SPL, but Magicblock SDK does not. IDL generation breaks, so no custom programs.
* Anchor 0.29.0 has partial support for Token22. No Metatada extension. Need to use Metaplex.
* Magicblock SDK partially supports Token22. Some API calls, like PDA derivation have hardcoded `Tokenkeg`.