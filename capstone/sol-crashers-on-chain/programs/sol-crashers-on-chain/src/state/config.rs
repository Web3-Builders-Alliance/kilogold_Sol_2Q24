use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use crate::constants::*;

#[account]
pub struct Config {
    // pub dev_authority: Pubkey,
    // pub bump_self: u8,
}

impl Config {
    // pub const LENGTH: usize = ANCHOR_DISCRIMINATOR_L 
    //     + PUBKEY_L
    //     + U8_L;
}