use std::result::Result;

use anchor_lang::prelude::*;
use crate::constants::*;


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum Consumable {
    LevelPotion,
    HealthPotion,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum CatalogItem {
    gold,
    gems,
    item(Consumable),
}
impl CatalogItem {
    pub const LGST_VARIANT_LENGTH: usize = U8_L;
    pub const LENGTH: usize = U8_L + Self::LGST_VARIANT_LENGTH;

    pub fn as_str(&self) -> &str {
        match self {
            CatalogItem::gold => "gold",
            CatalogItem::gems => "gems",
            CatalogItem::item(_) => "item",
        }
    }
}
impl std::str::FromStr for CatalogItem {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "gold" => Ok(CatalogItem::gold),
            "gems" => Ok(CatalogItem::gems),
            "item" => Ok(CatalogItem::item(Consumable::LevelPotion)),
            _ => Err(()),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
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