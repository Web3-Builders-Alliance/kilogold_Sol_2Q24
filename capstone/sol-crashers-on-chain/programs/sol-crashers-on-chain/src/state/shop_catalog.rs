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
impl CatalogItem {
    pub const LGST_VARIANT_LENGTH: usize = U8_L;
    pub const LENGTH: usize = U8_L + Self::LGST_VARIANT_LENGTH;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShopTrade {
    pub from_item: CatalogItem,
    pub amount_from_item: u64,

    pub to_item: CatalogItem,
    pub amount_to_item: u64,
}
impl ShopTrade {
    pub const LENGTH: usize = ANCHOR_DISCRIMINATOR_L
    + 2 * U64_L 
    + 2 * CatalogItem::LENGTH;
}

#[account]
pub struct ShopCatalog {
    pub trading_pairs: [ShopTrade;3],
}

impl ShopCatalog {
    pub const LENGTH: usize = ANCHOR_DISCRIMINATOR_L 
    + 3 * ShopTrade::LENGTH;
}