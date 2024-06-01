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
pub struct Initialize<'info> {

    /// The game dev account.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: 'signer' key.
    #[account(seeds = [b"auth"], bump)]
    pub authority: UncheckedAccount<'info>,

    #[account(
        init,
        signer,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = authority,
        extensions::metadata_pointer::authority = payer,
        extensions::metadata_pointer::metadata_address = mint,
        extensions::close_authority::authority = authority,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {  

    // TODO:
    // The program is signing for this CPI, but it does not have enough lamports to pay for the transaction.
    // Need to provide lamports to the program account.
    // Option B: Use the payer account to pay for the transaction - this is the dev account anyway.

    // Steps:
    // All you need to do here is:
    // 1. execute the initialize_token_metadata function we defined earlier
    // 2. reload the mint account, 
    // 3. update the mint account's lamports to the minimum balance using the helper function

    let cpi_accounts = TokenMetadataInitialize {
            token_program_id: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            metadata: ctx.accounts.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
            mint_authority: ctx.accounts.payer.to_account_info(),
            update_authority: ctx.accounts.payer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(), 
            cpi_accounts);
        
        token_metadata_initialize(cpi_ctx, "Gold".into(), "GLD".into(), "https://crashers/gld".into())?;


        ctx.accounts.mint.reload()?;

        update_account_lamports_to_minimum_balance(
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        )?;

    Ok(())
}

pub fn update_account_lamports_to_minimum_balance<'info>(
    account: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
) -> Result<()> {
    let extra_lamports = Rent::get()?.minimum_balance(account.data_len()) - account.get_lamports();
    if extra_lamports > 0 {
        invoke(
            &transfer(payer.key, account.key, extra_lamports),
            &[payer, account, system_program],
        )?;
    }
    Ok(())
}