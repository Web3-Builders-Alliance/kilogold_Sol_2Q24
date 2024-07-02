# Design Pillars
* No financialization. Assets are not transferable.
  *  Fungible assets only mint & burn.
* Gear is earned, not purchased.
  * Can be unlocked from other on-chain activities.
* Players can help each other, but no one pays to win.
  * Consumables are usable by every actor, including enemies.
  * Audiences can participate without grinding by casting consumables.
    * To purchase consumables, they will require Gems if not grinding the Gold.
    * Consumables casted by non-players are like divine interventions.

# In-Game Resources
## Gold
Used as the standard in-game currency for putchasing consumables.

## Gems
A premium currency, only acquired with fiat stablecoin purchase.  
Some consumables can only be purchased with Gems.

## Consumables

### Herbal Oil
Restores 10% HP.

### Health Potion
Restores 45% HP.

### Elixir
Restores 100% HP.

### Celeron Tonic (Gem only)
Decreases the time between attacks.

### Adrenaline Shot (Gem only)
Temporarily increases Max HP by 20%. 

# Battle System
* All combatants fight indefinitely.
* There is no death, only fainting.
  * Fainting incapacitates the combatant for a certain period of time.
* Consumables can be used on any combatant, including enemies.
  * Some enemies might have adverse reactions to certain consumables.
* Combat runs even while the game executable is terminated. Running on-chain.
* Level disparities will eventually arise; level gap between hero & enemy is too wide.
  * The battle may take exponentially longer for the enemy to eventually get defeated.
  * If the enemy is capable of healing, there's a probability the fight goes on forever.
  * Players can co-op by sending their heroes to the same instance, where they fight as a party.
  * Consumables usage is key to break the potential stalemate.
  * External character progression can help level the hero to overcome the gap.
* Gear comes in two forms:
  * Permanent: Once unlocked, the gear remains in the player's inventory.
  * Ephemeral: The gear only exists in players inventory so long as certain conditions are met.

# Character Progression
## In-Game Combat
* Every enemy defeated provised base EXP, which elevates base stats.
## On-Chain Activity
* Some on-chain activities count as EXP accumulation, like total number of Solana transactions.
* Certain equipment stats react to on-chain behaviors:
  * An Orca shield's defense may be proportional to how much LP the player has on the protocol.
  * A Bonk club's damage is based on the trading volume within the last 200 slots.
  * A base damage buff becomes active for all players whenever network stake is above 65%.

# Scope-Creep Wishlist
## Crash
Like a Limit-Break to execute a devastating attack.
It could come in two tiers:
* Crash: Single hero special ability.
* Dragon Crash: A higher-level crash. Only achievable via consumable buff.
* Combo Crash: Party-wide crash execution. 

Combo & Dragon present similar damage output. This way single players don't feel alienated from achieving the same damage.

## Bounties
Some players won't be DeFi degens, and may never achieve stat bonuses granted by certain on-chain activities. Other players may not be part of a community that usually bands together for a dungeon crawl.  
While assets cannot be transfered to other players, bounties are self-fulfilling contracts that conscript other players into co-op play. Bounty rewards can only be in fungible currency (Gold or Gems).  Aside from the Bounty rewards, conscripts also gain EXP for the enemies they help defeat.  
Bounty rewards can be fixed or auctioned. They can be specified by the bounty author, or negotiated just before conscription. 
