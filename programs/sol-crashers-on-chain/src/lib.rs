pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("ADQ3REAiRVbCjnTbNTyNe72Cabpr3Zy1ftDXKF7CxXLt");

#[program]
pub mod sol_crashers_on_chain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn mint(ctx: Context<ManageAsset>, amount: u32) -> Result<()> {
        manage_asset::mint(ctx, amount)
    }

    pub fn burn(ctx: Context<ManageAsset>, amount: u32) -> Result<()> {
        manage_asset::burn(ctx, amount)
    }
}
