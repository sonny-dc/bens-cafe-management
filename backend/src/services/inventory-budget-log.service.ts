import type { InventoryBudgetLog } from '../models/index.js';
import { inventoryBudgetLogRepository } from '../repositories/index.js';
import {
  InventoryBudgetLogNotFoundError
} from '../errors/index.js';

export async function getInventoryBudgetLogs(): Promise<InventoryBudgetLog[]> {
  return inventoryBudgetLogRepository.getInventoryBudgetLogs();
}

export async function getInventoryBudgetLogById(
  budgetLogId: number
): Promise<InventoryBudgetLog> {
  const inventoryBudgetLog = await inventoryBudgetLogRepository.getInventoryBudgetLogById(budgetLogId);
  if (!inventoryBudgetLog) {
    throw new InventoryBudgetLogNotFoundError();
  }
  return inventoryBudgetLog;
}
