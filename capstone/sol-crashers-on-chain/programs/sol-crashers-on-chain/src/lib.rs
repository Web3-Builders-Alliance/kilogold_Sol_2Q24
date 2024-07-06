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

    pub fn initialize(mut ctx: Context<Initialize>) -> Result<()> {
        initialize::config(&mut ctx)?;
        initialize::accounts(&mut ctx)?;
        initialize::shop(&mut ctx)?;
        Ok(())
    }

    pub fn shop_trade(ctx: Context<ManageAssetTrade>, trade_index: u8) -> Result<()> {
        manage_asset_trade::trade(ctx, trade_index)
    }

    pub fn asset_mint(ctx: Context<ManageAssetTrade>, asset_type: CatalogItem, amount: u64) -> Result<()> {
        manage_asset_trade::cpi_mint(&ctx, asset_type, amount)
    }

    pub fn asset_burn(ctx: Context<ManageAssetTrade>, asset_type: CatalogItem, amount: u64) -> Result<()> {
        manage_asset_trade::cpi_burn(&ctx, asset_type, amount)
    }
}
