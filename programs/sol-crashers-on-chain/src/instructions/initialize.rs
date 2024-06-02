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

use anchor_spl::token_interface::{
    token_metadata_initialize, Mint,
    Token2022, TokenMetadataInitialize,
};
use crate::state;

#[derive(Accounts)]
pub struct Initialize<'info> {

    /// The game dev account.
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = state::Config::LENGTH,
        seeds = [b"config"],
        bump,
        payer = payer,
    )]
    pub config: Account<'info, state::Config>,

    #[account(
        init,
        seeds = [
            b"mint", 
            b"gold"
        ],
        bump,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = mint,
        mint::freeze_authority = mint,
        extensions::metadata_pointer::authority = mint,
        extensions::metadata_pointer::metadata_address = mint,
        //extensions::close_authority::authority = payer, <- This breaks tests in weird ways.
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        seeds = [
            b"shop"
        ],
        bump,
        payer = payer,
        space = state::ShopCatalog::LENGTH,
    )]
    pub shop_catalog: Account<'info, state::ShopCatalog>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

pub fn config(ctx: &mut Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.dev_key = Some(*ctx.accounts.payer.key);
    config.bump_self = ctx.bumps.config;
    config.bump_mint_gold = ctx.bumps.mint;
    config.bump_shop_catalog = ctx.bumps.shop_catalog;
    Ok(())
}
pub fn accounts(ctx: &mut Context<Initialize>) -> Result<()> {  
    // HACK: Mint needs some SOL to pay for the CPI, because Mint is its own authority.
    // TODO: Calcualte how much for CPI.
    // Optimization: Have the payer account to pay for the metadata CPI without changing Mint authority.
    transfer_lamports(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        Rent::get()?.minimum_balance(10000000),
        ctx.accounts.system_program.to_account_info(),
    )?;
    msg!("HACK: Transferred lamports to mint account for CPI");

    // Steps:
    // All you need to do here is:
    // 1. execute the initialize_token_metadata function we defined earlier
    // 2. reload the mint account (data length has changed), 
    // 3. update the mint account's lamports to the minimum balance using the helper function
    let cpi_accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(), // metadata account is the mint, since data is stored in mint
        mint_authority: ctx.accounts.mint.to_account_info(),
        update_authority: ctx.accounts.mint.to_account_info(),
    };

    let seeds  = &[
        b"mint".as_ref(),
        b"gold".as_ref(),
        &[ctx.bumps.mint]
    ];
    let seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(), 
        cpi_accounts,
        seeds
    );
        
    // Step 1
    token_metadata_initialize(cpi_ctx, "Gold".into(), "GLD".into(), "https://crashers/gld".into())?;
    msg!("Initialized token metadata for mint account");


    // Step 2
    ctx.accounts.mint.reload()?;
    msg!("Reloaded mint account after metadata initialization");

    // Step 3
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;
    msg!("Updated mint account lamports to minimum balance after metadata initialization");

    Ok(())
}

pub fn shop(ctx: &mut Context<Initialize>) -> Result<()> {
    let shop_catalog = &mut ctx.accounts.shop_catalog;
    shop_catalog.trading_pairs[0].from_item = state::CatalogItem::gold;
    shop_catalog.trading_pairs[0].amount_from_item = 0;
    shop_catalog.trading_pairs[0].to_item = state::CatalogItem::gold;
    shop_catalog.trading_pairs[0].amount_to_item = 233;

    //TODO: Add remaining trading pairs

    Ok(())
}

fn update_account_lamports_to_minimum_balance<'info>(
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