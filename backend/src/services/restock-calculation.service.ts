import type {
  RestockCalculation,
  RestockCalculationItemWithInventoryDetails,
  CreateRestockCalculationInput
} from '../models/index.js';

import {
  INVENTORY_ITEM_STATUS,
  INVENTORY_BUDGET_TRANSACTION_TYPES,
  INVENTORY_BUDGET_SOURCE_TYPES,
  INVENTORY_ADJUSTMENT_TYPES
} from '../config/constants.js';

import { withTransaction } from '../config/database.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

import {
  restockCalculationRepository,
  restockCalculationItemRepository,
  inventoryBudgetAccountRepository,
  inventoryBudgetLogRepository,
  inventoryAdjustmentRepository,
  inventoryItemRepository
} from '../repositories/index.js';

import {
  // General Error
  AppError,

  // Restock Errors
  RestockCalculationNotFoundError,
  RestockCalculationCreationError,
  RestockCalculationExecutionError,

  // Inventory Item Errors
  InventoryItemNotFoundError,
  InventoryItemUpdateError,

  // Inventory Budget Account Errors
  InventoryBudgetAccountInsufficientBalanceError,
  InventoryBudgetAccountNotFoundError,
  InventoryBudgetAccountUpdateError,

  // Inventory Budget Log Errors
  InventoryBudgetLogCreationError

} from '../errors/index.js';

function toDecimalString(value: number): string {
  return value.toFixed(2);
}

function getInventoryStatus(
  stockQuantity: number,
  lowThreshold: number
) {
  if (stockQuantity <= 0) {
    return INVENTORY_ITEM_STATUS.OUT_OF_STOCK;
  }

  if (stockQuantity <= lowThreshold) {
    return INVENTORY_ITEM_STATUS.LOW_STOCK;
  }

  return INVENTORY_ITEM_STATUS.IN_STOCK;
}

function normalizeRestockItems(
  input: CreateRestockCalculationInput
): {
  itemId: number;
  quantityToBuy: number;
}[] {
  const itemMap = new Map<number, number>();

  for (const item of input.items) {
    const quantity = Number(item.quantityToBuy);

    itemMap.set(
      item.itemId,
      (itemMap.get(item.itemId) || 0) + quantity
    );
  }

  return Array.from(itemMap.entries()).map(([itemId, quantityToBuy]) => ({
    itemId,
    quantityToBuy
  }));
}

export async function executeRestockCalculation(
  input: CreateRestockCalculationInput,
  userId: number | null
): Promise<{
  restockCalculation: RestockCalculation;
  restockCalculationItems: RestockCalculationItemWithInventoryDetails[];
}> {
  try {
    return await withTransaction(async connection => {
      const postedAt = getCurrentAppDateTime();
      const normalizedItems = normalizeRestockItems(input);
      const itemIds = normalizedItems.map(item => item.itemId);

      const inventoryItems =
        await inventoryItemRepository.getInventoryItemsByIdsForUpdateWithConnection(
          itemIds,
          connection
        );

      if (inventoryItems.length !== itemIds.length) {
        throw new InventoryItemNotFoundError('One or more inventory items were not found');
      }

      const inventoryItemMap = new Map(
        inventoryItems.map(item => [item.itemId, item])
      );

      let totalEstimatedCost = 0;

      for (const item of normalizedItems) {
        const inventoryItem = inventoryItemMap.get(item.itemId);

        if (!inventoryItem) {
          throw new InventoryItemNotFoundError();
        }

        totalEstimatedCost += item.quantityToBuy * Number(inventoryItem.unitCost);
      }

      const totalEstimatedCostString = toDecimalString(totalEstimatedCost);

      const budgetAccount = await inventoryBudgetAccountRepository.getInventoryBudgetAccountForUpdateWithConnection(connection);

      if (budgetAccount === null) {
        throw new InventoryBudgetAccountNotFoundError();
      }

      const balanceBefore = Number(budgetAccount.currentBalance);
      const balanceAfter = balanceBefore - totalEstimatedCost;

      if (balanceAfter < 0) {
        throw new InventoryBudgetAccountInsufficientBalanceError();
      }

      const restockCalculation = await restockCalculationRepository.createRestockCalculationWithConnection(
          {
            userId,
            totalEstimatedCost: totalEstimatedCostString,
            postedAt
          },
          connection
        );
        
      if (!restockCalculation) {
        throw new RestockCalculationCreationError();
      }

      for (const item of normalizedItems) {
        const inventoryItem = inventoryItemMap.get(item.itemId);

        if (!inventoryItem) {
          throw new InventoryItemNotFoundError();
        }

        const oldQuantity = Number(inventoryItem.stockQuantity);
        const quantityToBuy = item.quantityToBuy;
        const newQuantity = oldQuantity + quantityToBuy;

        const newStatus = getInventoryStatus(
          newQuantity,
          Number(inventoryItem.lowThreshold)
        );

        await restockCalculationItemRepository.createRestockCalculationItemWithConnection(
          {
            calculationId: restockCalculation.calculationId,
            itemId: inventoryItem.itemId,
            quantityToBuy: toDecimalString(quantityToBuy),
            unitCostSnapshot: inventoryItem.unitCost
          },
          connection
        );

        const inventoryItemUpdate = await inventoryItemRepository.updateInventoryItemStockWithConnection(
          {
            itemId: inventoryItem.itemId,
            stockQuantity: toDecimalString(newQuantity),
            status: newStatus
          },
          connection
        );

        if (!inventoryItemUpdate) {
          throw new InventoryItemUpdateError();
        }

        await inventoryAdjustmentRepository.createInventoryAdjustmentWithConnection(
          {
            itemId: inventoryItem.itemId,
            userId,
            adjustmentType: INVENTORY_ADJUSTMENT_TYPES.ADD,
            quantityChanged: toDecimalString(quantityToBuy),
            oldQuantity: toDecimalString(oldQuantity),
            newQuantity: toDecimalString(newQuantity),
            reason: `Restock calculation #${restockCalculation.calculationId}`
          },
          connection
        );
      }

      const updatedBudgetAccount = await inventoryBudgetAccountRepository.updateInventoryBudgetAccountWithConnection(
        {
          budgetAccountId: 1,
          currentBalance: toDecimalString(balanceAfter)
        },
        connection
      );

      if (!updatedBudgetAccount) {
        throw new InventoryBudgetAccountUpdateError();
      }

      const inventoryBudgetLog = await inventoryBudgetLogRepository.createInventoryBudgetLogWithConnection(
        {
          budgetAccountId: 1,
          transactionType: INVENTORY_BUDGET_TRANSACTION_TYPES.OUT,
          amount: totalEstimatedCostString,
          sourceType: INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION,
          salesEntryId: null,
          restockCalculationId: restockCalculation.calculationId,
          balanceBefore: toDecimalString(balanceBefore),
          balanceAfter: toDecimalString(balanceAfter),
          userId: userId,
          postedAt: postedAt
        },
        connection
      );

      if (!inventoryBudgetLog) {
        throw new InventoryBudgetLogCreationError();
      }

      const restockCalculationItems =
        await restockCalculationItemRepository.getRestockCalculationItemsByCalculationIdWithConnection(
          restockCalculation.calculationId,
          connection
        );

      return {
        restockCalculation,
        restockCalculationItems
      };
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new RestockCalculationExecutionError();
  }
}

export async function getAllRestockCalculations(): Promise<RestockCalculation[]> {
  return restockCalculationRepository.getAllRestockCalculations();
}

export async function getRestockCalculationById(
  calculationId: number
): Promise<{
  restockCalculation: RestockCalculation;
  restockCalculationItems: RestockCalculationItemWithInventoryDetails[];
}> {
  const restockCalculation = await restockCalculationRepository.getRestockCalculationById(calculationId);

  if (restockCalculation === null) {
    throw new RestockCalculationNotFoundError();
  }

  const restockCalculationItems = await restockCalculationItemRepository.getRestockCalculationItemsByCalculationId(calculationId);

  return {
    restockCalculation,
    restockCalculationItems
  };
}
