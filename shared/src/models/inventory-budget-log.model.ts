import type {
  InventoryBudgetTransactionType,
  InventoryBudgetSourceType
} from '../constants/index.js';

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
