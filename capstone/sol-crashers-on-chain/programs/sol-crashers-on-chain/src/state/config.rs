use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Config {
    pub dev_key: Pubkey,
    pub bump_self: u8,
    pub bump_mint_gold: u8,
}

impl Config {
    pub const LENGTH: usize = ANCHOR_DISCRIMINATOR_L 
        + PUBKEY_L
        + U8_L
        + U8_L;
}