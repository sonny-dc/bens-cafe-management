import type { InventoryStatus, RequestStatus, PurchasePlanStatus } from '../constants/index.js';

/**
 * Represents a single inventory item in the cafe's stock
 */
export interface InventoryItem {
  itemId: number;
  itemName: string;
  category: string;
  unit: string;
  stockQuantity: number;
  reorderAt: number;
  unitPrice: number;
  status?: InventoryStatus;
}

/**
 * A staff request to restock an inventory item
 */
export interface InventoryRequest {
  requestId: number;
  employeeId: number;
  itemId: number;
  itemName?: string;
  requestedQuantity: string;
  requestedUnit: string;
  reason: string;
  requestStatus: RequestStatus;
  createdAt: string;
}

/**
 * A single line item inside a PurchasePlan
 */
export interface PurchasePlanItem {
  itemId: number;
  itemName: string;
  quantity: number;
  subtotal: number;
}

/**
 * A saved purchase plan created by the admin via the Purchase Calculator
 */
export interface PurchasePlan {
  planId: number;
  createdAt: string;
  totalCost: number;
  status: PurchasePlanStatus;
  items: PurchasePlanItem[];
}
