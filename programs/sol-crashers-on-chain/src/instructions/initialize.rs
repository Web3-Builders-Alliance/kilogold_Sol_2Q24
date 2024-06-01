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
        mint::authority = authority,
        mint::freeze_authority = authority,
        extensions::metadata_pointer::authority = authority,
        extensions::metadata_pointer::metadata_address = mint,
        extensions::close_authority::authority = authority,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {  

    // Steps:
    // All you need to do here is:
    // 1. execute the initialize_token_metadata function we defined earlier
    // 2. reload the mint account (data length has changed), 
    // 3. update the mint account's lamports to the minimum balance using the helper function

    // Need some SOL to pay for the CPI
    // TODO: Calcualte how much for CPI.
    // Optimization: Have the payer account to pay for the CPI without changing authority.
    transfer_lamports(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        Rent::get()?.minimum_balance(0),
        ctx.accounts.system_program.to_account_info(),
    )?;

    let cpi_accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
        mint_authority: ctx.accounts.authority.to_account_info(),
        update_authority: ctx.accounts.authority.to_account_info(),
    };

    let seeds = b"auth";
    let bump = ctx.bumps.authority;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(), 
        cpi_accounts,
        signer
    );
        
    // Step 1
    token_metadata_initialize(cpi_ctx, "Gold".into(), "GLD".into(), "https://crashers/gld".into())?;

    // Step 2
    ctx.accounts.mint.reload()?;

    // Step 3
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
    let extra_lamports = Rent::get()?
        .minimum_balance(account.data_len())
        .checked_sub(account.get_lamports())
        .unwrap_or_default();
    if extra_lamports > 0 {
        transfer_lamports(payer, account, extra_lamports, system_program)?;
    }
    Ok(())
}

fn transfer_lamports<'info>(payer: AccountInfo<'info>, account: AccountInfo<'info>, lamports: u64, system_program: AccountInfo<'info>) -> Result<()> {
    invoke(
        &transfer(payer.key, account.key, lamports),
        &[payer, account, system_program],
    )?;
    Ok(())
}