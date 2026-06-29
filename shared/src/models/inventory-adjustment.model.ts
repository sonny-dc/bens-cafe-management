import type { InventoryAdjustmentType } from '../constants/index.js';

export interface InventoryAdjustment {
  adjustmentId: number;
  itemId: number | null;
  userId: number | null;
  adjustmentType: InventoryAdjustmentType;
  quantityChanged: string;
  oldQuantity: string;
  newQuantity: string;
  reason: string | null;
  createdAt: Date;
}

export interface CreateInventoryAdjustmentRepositoryInput {
  itemId: number;
  userId: number | null;
  adjustmentType: InventoryAdjustmentType;
  quantityChanged: string;
  oldQuantity: string;
  newQuantity: string;
  reason: string | null;
}
