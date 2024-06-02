use anchor_lang::{
    prelude::*,
    solana_program::{
        account_info::AccountInfo,
        program::invoke,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction::transfer,
        sysvar::Sysvar,
    },
    Lamports,
};

use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::spl_token_2022::extension::{
        group_member_pointer::GroupMemberPointer, metadata_pointer::MetadataPointer,
        mint_close_authority::MintCloseAuthority, permanent_delegate::PermanentDelegate,
        transfer_hook::TransferHook,
    },
    token_interface::{
        spl_token_metadata_interface::state::TokenMetadata, token_metadata_initialize, Mint,
        Token2022, TokenAccount, TokenMetadataInitialize,
    },
};
use spl_pod::optional_keys::OptionalNonZeroPubkey;
use crate::state;

#[derive(Accounts)]
#[instruction(amount: u32)]
pub struct ManageAsset<'info> {
    #[account(
        seeds = [
            b"mint", 
            b"gold"
        ],
        bump, //Optimization: cache the bump.
    )]
    pub mint: InterfaceAccount<'info, Mint>,
}

pub fn mint(ctx: Context<ManageAsset>, amount: u32) -> Result<()> {
    Ok(())
}

pub fn burn(ctx: Context<ManageAsset>, amount: u32) -> Result<()> {
    Ok(())
}