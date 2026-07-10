import type { RestockCalculationItemWithInventoryDetails } from './restock-calculation-item.model.js';
import type { InventoryBudgetLog } from './inventory-budget-log.model.js';

export interface RestockCalculation {
  calculationId: number;
  userId: number | null;
  totalEstimatedCost: string;
  postedAt: Date;
  createdAt: Date;
}

export interface CreateRestockCalculationRepositoryInput {
  userId: number | null;
  totalEstimatedCost: string;
  postedAt: string;
}

export interface UpdateRestockCalculationRepositoryInput {
  calculationId: number;
  userId?: number | null;
  totalEstimatedCost?: string;
}

/**
 * Used by controller/service when executing a full restock session.
 * This comes from the frontend restock cart.
 */
export interface RestockCalculationItemInput {
  itemId: number;
  quantityToBuy: string;
}

export interface CreateRestockCalculationInput {
  items: RestockCalculationItemInput[];
}

export interface RestockCalculationSummary {
  restockCalculation: RestockCalculation;
  items: RestockCalculationItemWithInventoryDetails[];
  budgetLog: InventoryBudgetLog;
}
