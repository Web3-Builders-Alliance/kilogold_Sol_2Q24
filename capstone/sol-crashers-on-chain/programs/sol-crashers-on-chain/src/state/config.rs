use anchor_lang::prelude::*;
use crate::constants::*;
use crate::OPTION_L;

#[account]
pub struct Config {
    pub dev_key: Option<Pubkey>,
    pub bump_self: u8,
    pub bump_mint_gold: u8,
    pub bump_mint_gems: u8,
    pub bump_shop_catalog: u8,
}

impl Config {
    pub const LENGTH: usize = ANCHOR_DISCRIMINATOR_L 
        + OPTION_L!(PUBKEY_L)
        + U8_L
        + U8_L
        + U8_L
        + U8_L;
}