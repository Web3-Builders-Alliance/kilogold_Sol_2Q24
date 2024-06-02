use anchor_lang::
    prelude::*
;

use anchor_spl::{
    token_2022::{
        Token2022, mint_to, burn
    },
    token_interface::{
        Mint, TokenAccount, MintTo, Burn
    }
};
use crate::{state, CatalogItem};

#[derive(Accounts)]
pub struct ManageAsset<'info> {

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump_self,
    )]
    pub config: Account<'info, state::Config>,

    #[account(
        mut,
        seeds = [b"mint", b"gold"],
        bump = config.bump_mint_gold,
    )]
    pub mint_gold: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"shop"],
        bump = config.bump_shop_catalog,
    )]
    pub shop_catalog: Account<'info, state::ShopCatalog>,

    #[account(
        mut,
        associated_token::mint = mint_gold,
        associated_token::authority = mint_gold,
        associated_token::token_program = token_program

    )]
    pub token_account_gold: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
}

pub fn trade(ctx: Context<ManageAsset>, trade_index: u8) -> Result<()> {
    
    let trading_pair = ctx.accounts.shop_catalog.trading_pairs[trade_index as usize];

    cpi_mint(
        &ctx, 
        trading_pair.to_item,
        trading_pair.amount_to_item
    )?;

    cpi_burn(
        &ctx, 
        trading_pair.from_item,
        trading_pair.amount_from_item
    )?;

    Ok(())
}

fn cpi_mint(ctx: &Context<ManageAsset>, asset_type:CatalogItem, amount: u64) -> Result<()> {
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint_gold.to_account_info(),
        to: ctx.accounts.token_account_gold.to_account_info(),
        authority: ctx.accounts.mint_gold.to_account_info(),
    };

    let seeds  = &[
        b"mint".as_ref(),
        asset_type.as_str().as_bytes(),
        &[ctx.accounts.config.bump_mint_gold]
    ];
    let seeds = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program, 
        cpi_accounts, 
        seeds
    );

    mint_to(
        cpi_ctx, 
        amount
    )?;
    
    Ok(())
}

fn cpi_burn(ctx: &Context<ManageAsset>, asset_type:CatalogItem, amount: u64) -> Result<()> {
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint_gold.to_account_info(),
        from: ctx.accounts.token_account_gold.to_account_info(),
        authority: ctx.accounts.mint_gold.to_account_info(),
    };

    let seeds  = &[
        b"mint".as_ref(),
        asset_type.as_str().as_bytes(),
        &[ctx.accounts.config.bump_mint_gold]
    ];
    let seeds = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program, 
        cpi_accounts, 
        seeds
    );

    burn(
        cpi_ctx, 
        amount
    )?;
    
    Ok(())
}