import type { InventoryBudgetAccount } from '../models/index.js';
import { inventoryBudgetAccountRepository } from '../repositories/index.js';

export async function getInventoryBudgetAccount(): Promise<InventoryBudgetAccount | null> {
  return inventoryBudgetAccountRepository.getInventoryBudgetAccount();
}
