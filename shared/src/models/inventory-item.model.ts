import type {
  InventoryItemStatus,
  InventoryItemCategory
} from '../constants/index.js';

/**
 * Full backend representation of an inventory item, including all fields from the database.
 */
export interface InventoryItem {
  itemId: number;
  itemName: string;
  category: InventoryItemCategory;
  unit: string;
  stockQuantity: string;
  lowThreshold: string;
  unitCost: string;
  status: InventoryItemStatus;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * A simplified representation of an inventory item, used for displaying in lists or dropdowns.
 * This interface omits some of the more detailed fields present in the full InventoryItem interface.
 */
export interface InventoryItemListItem {
  itemId: number;
  itemName: string;
  category: InventoryItemCategory;
  unit: string;
  stockQty: number;
  threshold: number;
  unitCost: number;
  status: InventoryItemStatus;
}

/**
 * A representation of an inventory item as an option for selection, typically used in dropdowns or lists.
 */
export interface InventoryItemOption {
  itemId: number;
  itemName: string;
  unit: string;
  stockQuantity: string;
}

export interface CreateInventoryItemInput {
  itemName: string;
  category: InventoryItemCategory;
  unit: string;
  stockQuantity: string;
  lowThreshold: string;
  unitCost: string;
  userId: number | null;
}

export interface UpdateInventoryItemInput {
  itemId: number;
  itemName?: string;
  category?: InventoryItemCategory;
  unit?: string;
  stockQuantity?: string;
  lowThreshold?: string;
  unitCost?: string;
  userId: number | null;
}

export interface CreateInventoryItemRepositoryInput extends CreateInventoryItemInput {
  status: InventoryItemStatus;
}

export interface UpdateInventoryItemRepositoryInput extends UpdateInventoryItemInput {
  status: InventoryItemStatus;
}
