use anchor_lang::{
    prelude::{Sysvar, *},
    solana_program::{
        account_info::AccountInfo,
        program::invoke,
        pubkey::Pubkey,
        rent::Rent,
        system_instruction::transfer,
        //sysvar::Sysvar,
    },
    Lamports,
};
use anchor_spl::metadata::{
    mpl_token_metadata::types::DataV2,
    Metadata,CreateMetadataAccountsV3 ,create_metadata_accounts_v3};
use anchor_spl::token_interface::{ 
    Mint,
    Token2022,
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
    pub config: Box<Account<'info, state::Config>>,

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
        mint::authority = mint_gold,
        mint::freeze_authority = mint_gold,
        //extensions::metadata_pointer::authority = mint_gold,
        //extensions::metadata_pointer::metadata_address = mint_gold,
        //extensions::close_authority::authority = payer, <- This breaks tests in weird ways.
    )]
    pub mint_gold: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata_gold: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            b"mint", 
            b"gems"
        ],
        bump,
        payer = payer,
        mint::token_program = token_program,
        mint::decimals = 0,
        mint::authority = mint_gems,
        mint::freeze_authority = mint_gems,
        //extensions::metadata_pointer::authority = mint_gems,
        //extensions::metadata_pointer::metadata_address = mint_gems,
        //extensions::close_authority::authority = payer, <- This breaks tests in weird ways.
    )]
    pub mint_gems: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata_gems: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            b"shop"
        ],
        bump,
        payer = payer,
        space = state::ShopCatalog::LENGTH,
    )]
    pub shop_catalog: Box<Account<'info, state::ShopCatalog>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent_program: Sysvar<'info, Rent>,
    pub token_metadata_program: Program<'info, Metadata>,

}

pub fn config(ctx: &mut Context<Initialize>) -> Result<()> {
    msg!("Initializing Config");

    let config = &mut ctx.accounts.config;
    config.dev_key = Some(*ctx.accounts.payer.key);
    config.bump_self = ctx.bumps.config;
    config.bump_mint_gold = ctx.bumps.mint_gold;
    config.bump_mint_gems = ctx.bumps.mint_gems;
    config.bump_shop_catalog = ctx.bumps.shop_catalog;
    Ok(())
}
pub fn accounts(ctx: &mut Context<Initialize>) -> Result<()> {  

    msg!("Initializing GOLD mint account.");

    set_mint_account(ctx, 
        "Gold".into(), 
        "GLD".into(), 
        "https://gold.com".into(), 
        &mut ctx.accounts.mint_gold.clone(),
        & mut ctx.accounts.metadata_gold.clone(),
        b"gold",
    ctx.bumps.mint_gold
    )?;

    msg!("Initializing GEMS mint account.");

    set_mint_account(ctx,
        "Gems".into(), 
        "GEM".into(), 
        "https://gems.com".into(),
        &mut ctx.accounts.mint_gems.clone(),
        & mut ctx.accounts.metadata_gems.clone(),
        b"gems",
    ctx.bumps.mint_gems
    )?;

    Ok(())
}

fn set_mint_account<'a>(ctx: &mut Context<Initialize<'a>>, 
    name: String, 
    symbol: String, 
    uri: String, 
    mint_account: &mut InterfaceAccount<'a, Mint>, 
    mint_metadata_account: &mut UncheckedAccount<'a>, 
    mint_seed: &[u8], 
    mint_bump: u8) -> Result<()> {
    msg!("Creating metadata CPI signer");

    let seeds  = &[
        b"mint".as_ref(),
        b"gold".as_ref(),
        &[ctx.bumps.mint_gold]
    ];

    let signer = [&seeds[..]];

    msg!("Creating metadata context");

    let token_data: DataV2 = DataV2 {
        name: name,
        symbol: symbol,
        uri: uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            payer: ctx.accounts.payer.to_account_info(),
            update_authority: mint_account.to_account_info(),
            mint: mint_account.to_account_info(),
            metadata: mint_metadata_account.to_account_info(),
            mint_authority: mint_account.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent_program.to_account_info(),
        },
        &signer
    );

    msg!("Invoking metadata creation CPI");

    create_metadata_accounts_v3(
        metadata_ctx,
        token_data,
        false,
        true,
        None,
    )?;

    msg!("Initialized token metadata for mint account");

    Ok(())
}

pub fn shop(ctx: &mut Context<Initialize>) -> Result<()> {
    let shop_catalog = &mut ctx.accounts.shop_catalog;
    shop_catalog.trading_pairs[0].from_item = state::CatalogItem::gold;
    shop_catalog.trading_pairs[0].amount_from_item = 0;
    shop_catalog.trading_pairs[0].to_item = state::CatalogItem::gold;
    shop_catalog.trading_pairs[0].amount_to_item = 233;

    shop_catalog.trading_pairs[1].from_item = state::CatalogItem::gold;
    shop_catalog.trading_pairs[1].amount_from_item = 100;
    shop_catalog.trading_pairs[1].to_item = state::CatalogItem::gems;
    shop_catalog.trading_pairs[1].amount_to_item = 20;

    //TODO: Add remaining trading pairs
    //TODO: Parameterize the trading pairs via instruction args.

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