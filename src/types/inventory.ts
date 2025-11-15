export type ItemType = "weapon" | "armor" | "consumable" | "quest" | "misc";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipmentSlot = "weapon" | "head" | "chest" | "legs" | "feet" | "accessory";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stackable: boolean;
  maxStack?: number;
  value: number;
}

export interface WeaponItem extends Item {
  type: "weapon";
  damage: number;
  slot: "weapon";
  requiredLevel: number;
}

export interface ArmorItem extends Item {
  type: "armor";
  defense: number;
  slot: EquipmentSlot;
  requiredLevel: number;
}

export interface ConsumableItem extends Item {
  type: "consumable";
  effect: {
    type: "heal_hp" | "heal_mp" | "buff_stat";
    value: number;
    duration?: number;
  };
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export interface Equipment {
  weapon: WeaponItem | null;
  head: ArmorItem | null;
  chest: ArmorItem | null;
  legs: ArmorItem | null;
  feet: ArmorItem | null;
  accessory: ArmorItem | null;
}

export interface Currency {
  gold: number;
  gems: number;
}

export interface Inventory {
  items: InventorySlot[];
  equipment: Equipment;
  currency: Currency;
  capacity: number;
}

