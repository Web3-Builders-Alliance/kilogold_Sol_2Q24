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
        mut,
        seeds = [b"mint", b"gems"],
        bump = config.bump_mint_gems,
    )]
    pub mint_gems: InterfaceAccount<'info, Mint>,

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

    #[account(
        mut,
        associated_token::mint = mint_gems,
        associated_token::authority = mint_gems,
        associated_token::token_program = token_program
    )]
    pub token_account_gems: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
}

pub fn trade(ctx: Context<ManageAsset>, trade_index: u8) -> Result<()> {
    
    msg!("Conducting trade index: {}", trade_index);

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

    let (mint_account, token_account, mint_bump) = match asset_type {
        CatalogItem::gold => (ctx.accounts.mint_gold.clone(), ctx.accounts.token_account_gold.clone(), ctx.accounts.config.bump_mint_gold),
        CatalogItem::gems => (ctx.accounts.mint_gems.clone(), ctx.accounts.token_account_gems.clone(), ctx.accounts.config.bump_mint_gems),
        _ => return Err(crate::error::ErrorCode::InvalidCatalogItemError.into())
    };

    let cpi_accounts = MintTo {
        mint: mint_account.to_account_info(),
        to: token_account.to_account_info(),
        authority: mint_account.to_account_info(),
    };

    let seeds  = &[
        b"mint".as_ref(),
        asset_type.as_str().as_bytes(),
        &[mint_bump]
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

    let (mint_account, token_account, mint_bump) = match asset_type {
        CatalogItem::gold => (ctx.accounts.mint_gold.clone(), ctx.accounts.token_account_gold.clone(), ctx.accounts.config.bump_mint_gold),
        CatalogItem::gems => (ctx.accounts.mint_gems.clone(), ctx.accounts.token_account_gems.clone(), ctx.accounts.config.bump_mint_gems),
        _ => return Err(crate::error::ErrorCode::InvalidCatalogItemError.into())
    };

    let cpi_accounts = Burn {
        mint: mint_account.to_account_info(),
        from: token_account.to_account_info(),
        authority: mint_account.to_account_info(),
    };

    let seeds  = &[
        b"mint".as_ref(),
        asset_type.as_str().as_bytes(),
        &[mint_bump]
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