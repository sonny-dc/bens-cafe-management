import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
  InventoryBudgetLog,
  CreateInventoryBudgetLogRepositoryInput
} from '../models/index.js';

import type {
  InventoryBudgetTransactionType,
  InventoryBudgetSourceType
} from '../config/constants.js';

type InventoryBudgetLogRow = RowDataPacket & {
  budget_log_id: number;
  budget_account_id: number;
  transaction_type: InventoryBudgetTransactionType;
  amount: string;
  source_type: InventoryBudgetSourceType;
  sales_entry_id: number | null;
  restock_calculation_id: number | null;
  balance_before: string;
  balance_after: string;
  user_id: number | null;
  posted_at: Date;
};

function mapInventoryBudgetLogRow(
  row: InventoryBudgetLogRow
): InventoryBudgetLog {
  return {
    budgetLogId: row.budget_log_id,
    budgetAccountId: row.budget_account_id,
    transactionType: row.transaction_type,
    amount: row.amount,
    sourceType: row.source_type,
    salesEntryId: row.sales_entry_id,
    restockCalculationId: row.restock_calculation_id,
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    userId: row.user_id,
    postedAt: row.posted_at
  };
}

async function getInventoryBudgetLogByIdWithConnection(
  budgetLogId: number,
  connection: PoolConnection
): Promise<InventoryBudgetLog | null> {
  const [rows] = await connection.query<InventoryBudgetLogRow[]>(
    `
    SELECT
      budget_log_id,
      budget_account_id,
      transaction_type,
      amount,
      source_type,
      sales_entry_id,
      restock_calculation_id,
      balance_before,
      balance_after,
      user_id,
      posted_at
    FROM inventory_budget_logs
    WHERE budget_log_id = ?
    LIMIT 1
    `,
    [budgetLogId]
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapInventoryBudgetLogRow(row);
}

export async function createInventoryBudgetLogWithConnection(
  input: CreateInventoryBudgetLogRepositoryInput,
  connection: PoolConnection
): Promise<InventoryBudgetLog> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    INSERT INTO inventory_budget_logs (
      budget_account_id,
      transaction_type,
      amount,
      source_type,
      sales_entry_id,
      restock_calculation_id,
      balance_before,
      balance_after,
      user_id,
      posted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `,
    [
      input.budgetAccountId ?? 1,
      input.transactionType,
      input.amount,
      input.sourceType,
      input.salesEntryId,
      input.restockCalculationId,
      input.balanceBefore,
      input.balanceAfter,
      input.userId,
      input.postedAt ?? null
    ]
  );

  const budgetLog = await getInventoryBudgetLogByIdWithConnection(
    result.insertId,
    connection
  );

  if (budgetLog === null) {
    throw new Error('Failed to retrieve the newly created inventory budget log.');
  }

  return budgetLog;
}

export async function createInventoryBudgetLog(
  input: CreateInventoryBudgetLogRepositoryInput
): Promise<InventoryBudgetLog> {
  return withConnection(async connection => {
    return createInventoryBudgetLogWithConnection(input, connection);
  });
}

export async function getInventoryBudgetLogById(
  budgetLogId: number
): Promise<InventoryBudgetLog | null> {
  return withConnection(async connection => {
    return getInventoryBudgetLogByIdWithConnection(
      budgetLogId,
      connection
    );
  });
}

export async function getInventoryBudgetLogs(): Promise<InventoryBudgetLog[]> {
  return withConnection(async connection => {
    const [rows] = await connection.query<InventoryBudgetLogRow[]>(
      `
      SELECT
        budget_log_id,
        budget_account_id,
        transaction_type,
        amount,
        source_type,
        sales_entry_id,
        restock_calculation_id,
        balance_before,
        balance_after,
        user_id,
        posted_at
      FROM inventory_budget_logs
      ORDER BY budget_log_id ASC
      `
    );

    return rows.map(mapInventoryBudgetLogRow);
  });
}
