import type { InventoryBudgetLog } from '../models/index.js';
import { inventoryBudgetLogRepository } from '../repositories/index.js';

export async function getInventoryBudgetLogs(): Promise<InventoryBudgetLog[]> {
  return inventoryBudgetLogRepository.getInventoryBudgetLogs();
}

export async function getInventoryBudgetLogById(
  budgetLogId: number
): Promise<InventoryBudgetLog | null> {
  return inventoryBudgetLogRepository.getInventoryBudgetLogById(budgetLogId);
}
