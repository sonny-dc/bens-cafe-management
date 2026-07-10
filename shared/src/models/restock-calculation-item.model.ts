import { type InventoryItemCategory } from "../constants/app.constants.js";
export interface RestockCalculationItem {
  calculationItemId: number;
  calculationId: number;
  itemId: number | null;
  quantityToBuy: string;
  unitCostSnapshot: string;
  estimatedCost: string;
}

export interface RestockCalculationItemWithInventoryDetails {
  calculationItemId: number;
  calculationId: number;
  itemId: number | null;
  itemName: string | null;
  category: InventoryItemCategory | null;
  unit: string | null;
  quantityToBuy: string;
  unitCostSnapshot: string;
  estimatedCost: string;
}

export interface CreateRestockCalculationItemRepositoryInput {
  calculationId: number;
  itemId: number;
  quantityToBuy: string;
  unitCostSnapshot: string;
}
