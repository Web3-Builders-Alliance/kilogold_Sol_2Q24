use anchor_lang::prelude::*;

declare_id!("91aPi6eEmNW9GDfn9ypRM7ydLT4mhdLVh8kQ57xAv3tS");

mod state;

mod contexts;

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
