import type { 
  InventoryBudgetLog,
  InventoryBudgetLogSummary, 
  SalesEntryBudgetLogSummary, 
  RestockCalculationBudgetLogSummary 
} from '../models/index.js';

import { INVENTORY_BUDGET_SOURCE_TYPES } from '../config/constants.js';
import type { PoolConnection } from 'mysql2/promise';

import { 
  inventoryBudgetLogRepository,
  salesEntryRepository,
  payrollEntryRepository,
  expenseRepository,
  restockCalculationRepository,
  restockCalculationItemRepository
 } from '../repositories/index.js';

import {
  InventoryBudgetLogNotFoundError,
  InventoryBudgetLogSourceNotFound,
  SalesEntryNotFoundError,
  PayrollEntryNotFoundError,
  RestockCalculationNotFoundError,
  RestockCalculationItemNotFoundError
} from '../errors/index.js';

import { withConnection } from '../config/database.js';

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

export async function getInventoryBudgetLogSummaryById(
  budgetLogId: number
): Promise<InventoryBudgetLogSummary> {
  return withConnection(async (connection) => {
    const inventoryBudgetLog = await inventoryBudgetLogRepository.getInventoryBudgetLogByIdWithConnection(budgetLogId, connection);
    if (!inventoryBudgetLog) {
      throw new InventoryBudgetLogNotFoundError();
    }
    if (inventoryBudgetLog.sourceType === INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY) {
      return getSalesEntrySummaryWithConnection(inventoryBudgetLog, connection);
    }
    else if (inventoryBudgetLog.sourceType === INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION) {
      return getRestockSummaryWithConnection(inventoryBudgetLog, connection);
      
    }
    else {
      throw new InventoryBudgetLogSourceNotFound('Inventory budget log source type is invalid or unrecognized.');
    }
  });
}

// ===========================
// Helper Functions
// ===========================

async function getSalesEntrySummaryWithConnection(
  inventoryBudgetLog: InventoryBudgetLog,
  connection: PoolConnection
): Promise<SalesEntryBudgetLogSummary> {
  if (inventoryBudgetLog.salesEntryId === null) {
    throw new InventoryBudgetLogSourceNotFound('Sales entry budget log is missing its sales entry reference.');
  }
  const salesEntry = await salesEntryRepository.getSalesEntryByIdWithConnection(inventoryBudgetLog.salesEntryId, connection);
  if (!salesEntry) {
    throw new SalesEntryNotFoundError();
  }
  const payrollEntries = await payrollEntryRepository.getPayrollEntriesWithEmployeeDetailsBySalesEntryIdWithConnection(inventoryBudgetLog.salesEntryId, connection);
  if (payrollEntries.length === 0) {
    throw new PayrollEntryNotFoundError();
  }
  const expenses = await expenseRepository.getExpensesBySalesEntryIdWithConnection(inventoryBudgetLog.salesEntryId, connection);
  return {
    sourceType: INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY,
    summary: {
      salesEntry: salesEntry,
      payrollEntries: payrollEntries,
      expenses: expenses,
      budgetLog: inventoryBudgetLog
    }
  };
}

async function getRestockSummaryWithConnection(
  inventoryBudgetLog: InventoryBudgetLog,
  connection: PoolConnection
): Promise<RestockCalculationBudgetLogSummary> {
  if (inventoryBudgetLog.restockCalculationId === null) {
    throw new InventoryBudgetLogSourceNotFound('Restock calculation budget log is missing its restock calculation reference.');
  }
  const restockCalculation = await restockCalculationRepository.getRestockCalculationByIdWithConnection(inventoryBudgetLog.restockCalculationId, connection);
  if (!restockCalculation) {
    throw new RestockCalculationNotFoundError();
  }
  const restockCalculationItems = await restockCalculationItemRepository.getRestockCalculationItemsByCalculationIdWithConnection(inventoryBudgetLog.restockCalculationId, connection);
  if (restockCalculationItems.length === 0) {
    throw new RestockCalculationItemNotFoundError();
  }
  return {
    sourceType: INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION,
    summary: {
      restockCalculation: restockCalculation,
      items: restockCalculationItems,
      budgetLog: inventoryBudgetLog
    }
  };
}
