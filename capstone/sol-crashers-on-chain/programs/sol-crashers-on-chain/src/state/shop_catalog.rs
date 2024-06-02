use anchor_lang::prelude::*;
use crate::constants::*;


#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Consumable {
    LevelPotion,
    HealthPotion,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CatalogItem {
    Gold,
    Gems,
    Item(Consumable),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShopTrade {
    pub from_item: CatalogItem,
    pub amount_from_item: u64,

    pub to_item: CatalogItem,
    pub amount_to_item: u64,
}

#[account]
pub struct ShopCatalog {
    pub trading_pairs: [ShopTrade;3],
}