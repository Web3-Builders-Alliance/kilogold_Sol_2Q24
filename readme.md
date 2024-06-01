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
                Mint Auth: Gold Mint"
                Metadata: Gold Mint
                Close Auth: SolCrash

            ]
            
            goldATA_Bob["Bob Gold ATA
                Seeds: Bob, 'gold'
                Auth: SolCrash"
            ]
            
            gemMint["Gem Mint Acct
                Seed: 'mint'
                Mint Auth: Gem Mint"
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
