import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
  InventoryBudgetAccount,
  UpdateInventoryBudgetAccountRepositoryInput
} from '../models/index.js';

type InventoryBudgetAccountRow = RowDataPacket & {
  budget_account_id: number;
  current_balance: string;
  created_at: Date;
  updated_at: Date | null;
};

function mapInventoryBudgetAccountRow(
  row: InventoryBudgetAccountRow
): InventoryBudgetAccount {
  return {
    budgetAccountId: row.budget_account_id,
    currentBalance: row.current_balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getInventoryBudgetAccountByIdWithConnection(
  budgetAccountId: number,
  connection: PoolConnection
): Promise<InventoryBudgetAccount | null> {
  const [rows] = await connection.query<InventoryBudgetAccountRow[]>(
    `
    SELECT
      budget_account_id,
      current_balance,
      created_at,
      updated_at
    FROM inventory_budget_accounts
    WHERE budget_account_id = ?
    LIMIT 1
    `,
    [budgetAccountId]
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapInventoryBudgetAccountRow(row);
}

export async function getInventoryBudgetAccount(): Promise<InventoryBudgetAccount | null> {
  return withConnection(async connection => {
    return getInventoryBudgetAccountByIdWithConnection(1, connection);
  });
}

export async function getInventoryBudgetAccountWithConnection(
  connection: PoolConnection
): Promise<InventoryBudgetAccount | null> {
  return getInventoryBudgetAccountByIdWithConnection(1, connection);
}

export async function getInventoryBudgetAccountForUpdateWithConnection(
  connection: PoolConnection
): Promise<InventoryBudgetAccount | null> {
  const [rows] = await connection.query<InventoryBudgetAccountRow[]>(
    `
    SELECT
      budget_account_id,
      current_balance,
      created_at,
      updated_at
    FROM inventory_budget_accounts
    WHERE budget_account_id = 1
    FOR UPDATE
    `
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapInventoryBudgetAccountRow(row);
}

export async function updateInventoryBudgetAccountWithConnection(
  input: UpdateInventoryBudgetAccountRepositoryInput,
  connection: PoolConnection
): Promise<InventoryBudgetAccount | null> {
  await connection.execute<ResultSetHeader>(
    `
    UPDATE inventory_budget_accounts
    SET current_balance = ?
    WHERE budget_account_id = ?
    `,
    [
      input.currentBalance,
      input.budgetAccountId
    ]
  );

  return getInventoryBudgetAccountByIdWithConnection(
    input.budgetAccountId,
    connection
  );
}

export async function updateInventoryBudgetAccount(
  input: UpdateInventoryBudgetAccountRepositoryInput
): Promise<InventoryBudgetAccount | null> {
  return withConnection(async connection => {
    return updateInventoryBudgetAccountWithConnection(input, connection);
  });
}
