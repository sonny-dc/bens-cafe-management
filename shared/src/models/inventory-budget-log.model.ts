import {
  type InventoryBudgetTransactionType,
  type InventoryBudgetSourceType,
  INVENTORY_BUDGET_SOURCE_TYPES
} from '../constants/index.js';
import type { SalesEntrySummary } from './sales-entry.model.js';
import type { RestockCalculationSummary } from './restock-calculation.model.js';

export interface InventoryBudgetLog {
  budgetLogId: number;
  budgetAccountId: number;
  transactionType: InventoryBudgetTransactionType;
  amount: string;
  sourceType: InventoryBudgetSourceType;
  salesEntryId: number | null;
  restockCalculationId: number | null;
  balanceBefore: string;
  balanceAfter: string;
  userId: number | null;
  postedAt: Date;
}

export interface CreateInventoryBudgetLogRepositoryInput {
  budgetAccountId?: number;
  transactionType: InventoryBudgetTransactionType;
  amount: string;
  sourceType: InventoryBudgetSourceType;
  salesEntryId: number | null;
  restockCalculationId: number | null;
  balanceBefore: string;
  balanceAfter: string;
  userId: number | null;
  postedAt?: string;
}

export interface SalesEntryBudgetLogSummary {
  sourceType: typeof INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY;
  summary: SalesEntrySummary;
}

export interface RestockCalculationBudgetLogSummary {
  sourceType: typeof INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION;
  summary: RestockCalculationSummary;
}

export type InventoryBudgetLogSummary =
  | SalesEntryBudgetLogSummary
  | RestockCalculationBudgetLogSummary;
