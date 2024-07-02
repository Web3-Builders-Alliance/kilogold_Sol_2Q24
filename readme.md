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
* To accelerate development, we'll let players be authority over ATA. They should not be messing with it directly.
  * TODO: Restrict player authority by setting `SolCrash Program` as the authority, and wrapping instructions as CPI's.

# Instructions
## Initialize
```mermaid
sequenceDiagram
    participant Dev as Dev Account
    participant SolCrash as SolCrash Program
    participant ATAProg as ATA Program
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

# TODO
* New player registration flow.

# FAQ
**Why use Token Accounts instead of storing all player data in a single account?**  
This way some aspects of the game are readily indexed by blockchain scanners, as it adheres to typical token standards.

**How come ATA addresses are being manually derrived, when we have libraries and on-chain programs to do it for us?**  
ATA's are prototypically PDA's of a Mint account. Our Mint accounts are PDA's themselves, making ATA's a *"PDA (Token) of a PDA (Mint)"*. This is a slight deviation from the API's conventions, so we must derive addresses manually.
