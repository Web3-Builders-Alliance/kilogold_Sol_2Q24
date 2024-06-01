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
            program("SolCrash Program")
            
            goldMint["Gold Mint Acct
                Seed: 'gold'
                Mint Auth: Gold Mint
                Metadata: Gold Mint
                Close Auth: Gold Mint"
            ]
            
            goldATA_Bob["Bob Gold ATA
                Seeds: Bob, 'gold'
                Auth: Gold Mint"
            ]
            
            gemMint["Gem Mint Acct
                Seed: 'mint'
                Mint Auth: Gem Mint
                Metadata: Gem Mint
                Close Auth: Gem Mint"
            ]
            
            gemATA_Bob["Bob Gem ATA
                Seeds: Bob, 'gem'
                Auth: Gem Mint"
            ]

            program --[PDA]--> goldMint
            program --[PDA]--> gemMint
            goldMint --[PDA]--> goldATA_Bob
            gemMint --[PDA]--> gemATA_Bob

            direction LR
            accountB["Bob Acct"]
            accountB -.->|mint_gold#40;amount#41;| program  
```

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