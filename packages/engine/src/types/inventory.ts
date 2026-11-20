export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const EQUIPMENT_SLOTS = ["weapon", "head", "chest", "legs", "feet", "accessory"] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];
export type ArmorSlot = Exclude<EquipmentSlot, "weapon">;

interface ItemBase {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  stackable: boolean;
  maxStack?: number;
  value: number;
}

export interface WeaponItem extends ItemBase {
  type: "weapon";
  damage: number;
  slot: "weapon";
  requiredLevel: number;
}

export interface ArmorItem extends ItemBase {
  type: "armor";
  defense: number;
  slot: ArmorSlot;
  requiredLevel: number;
}

export interface ConsumableItem extends ItemBase {
  type: "consumable";
  effect: {
    type: "heal_hp" | "heal_mp" | "buff_stat";
    value: number;
    duration?: number;
  };
}

export interface MiscItem extends ItemBase {
  type: "quest" | "misc";
}

/** Discriminated by `type`: narrowing on it gives the right fields without casts. */
export type Item = WeaponItem | ArmorItem | ConsumableItem | MiscItem;
export type ItemType = Item["type"];
export type EquippableItem = WeaponItem | ArmorItem;

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
