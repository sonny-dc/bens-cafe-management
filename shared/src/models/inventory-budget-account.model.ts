export interface InventoryBudgetAccount {
  budgetAccountId: number;
  currentBalance: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface UpdateInventoryBudgetAccountRepositoryInput {
  budgetAccountId: number;
  currentBalance: string;
}
