use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";

pub const U8_L: usize = 1; 
pub const U16_L: usize = 2;
pub const PUBKEY_L: usize = 32;
pub const ANCHOR_DISCRIMINATOR_L: usize = 8;

// Declarative macro adding 1 to the input.
#[macro_export]
macro_rules! OPTION_L {
    ($x:expr) => {
        1 + $x
    };
}