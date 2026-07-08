import type { InventoryBudgetAccount } from '../models/index.js';
import { inventoryBudgetAccountRepository } from '../repositories/index.js';
import {
  InventoryBudgetAccountNotFoundError
} from '../errors/index.js';

export async function getInventoryBudgetAccount(): Promise<InventoryBudgetAccount> {
  const inventoryBudgetAccount = await inventoryBudgetAccountRepository.getInventoryBudgetAccount();
  if (!inventoryBudgetAccount) {
    throw new InventoryBudgetAccountNotFoundError();
  }
  return inventoryBudgetAccount;
}
