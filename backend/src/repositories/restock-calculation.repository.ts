import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
  RestockCalculation,
  CreateRestockCalculationRepositoryInput,
  UpdateRestockCalculationRepositoryInput
} from '../models/index.js';

type RestockCalculationRow = RowDataPacket & {
  calculation_id: number;
  user_id: number | null;
  total_estimated_cost: string;
  created_at: Date;
};

function mapRestockCalculationRow(
  row: RestockCalculationRow
): RestockCalculation {
  return {
    calculationId: row.calculation_id,
    userId: row.user_id,
    totalEstimatedCost: row.total_estimated_cost,
    createdAt: row.created_at
  };
}

async function getRestockCalculationByIdWithConnection(
  calculationId: number,
  connection: PoolConnection
): Promise<RestockCalculation | null> {
  const [rows] = await connection.query<RestockCalculationRow[]>(
    `
    SELECT
      calculation_id,
      user_id,
      total_estimated_cost,
      created_at
    FROM restock_calculations
    WHERE calculation_id = ?
    LIMIT 1
    `,
    [calculationId]
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapRestockCalculationRow(row);
}

/**
 * ROUTE: GET /api/restock-calculations
 */
export async function getAllRestockCalculations(): Promise<RestockCalculation[]> {
  return withConnection(async connection => {
    const [rows] = await connection.query<RestockCalculationRow[]>(
      `
      SELECT
        calculation_id,
        user_id,
        total_estimated_cost,
        created_at
      FROM restock_calculations
      ORDER BY created_at DESC
      `
    );

    return rows.map(mapRestockCalculationRow);
  });
}

/**
 * ROUTE: GET /api/restock-calculations/:calculationId
 */
export async function getRestockCalculationById(
  calculationId: number
): Promise<RestockCalculation | null> {
  return withConnection(async connection => {
    return getRestockCalculationByIdWithConnection(
      calculationId,
      connection
    );
  });
}

/**
 * TRANSACTION USE:
 * Used by service when creating a full restock transaction.
 */
export async function createRestockCalculationWithConnection(
  input: CreateRestockCalculationRepositoryInput,
  connection: PoolConnection
): Promise<RestockCalculation> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    INSERT INTO restock_calculations (
      user_id,
      total_estimated_cost
    )
    VALUES (?, ?)
    `,
    [
      input.userId,
      input.totalEstimatedCost
    ]
  );

  const restockCalculation = await getRestockCalculationByIdWithConnection(
    result.insertId,
    connection
  );

  if (restockCalculation === null) {
    throw new Error('Failed to retrieve the newly created restock calculation.');
  }

  return restockCalculation;
}

/**
 * ROUTE: POST /api/restock-calculations
 *
 * This is a simple table-only create.
 * Full restock execution should use the service transaction instead.
 */
export async function createRestockCalculation(
  input: CreateRestockCalculationRepositoryInput
): Promise<RestockCalculation> {
  return withConnection(async connection => {
    return createRestockCalculationWithConnection(input, connection);
  });
}

/**
 * TRANSACTION USE:
 * Used by service if total cost needs to be updated after child items are inserted.
 */
export async function updateRestockCalculationWithConnection(
  input: UpdateRestockCalculationRepositoryInput,
  connection: PoolConnection
): Promise<RestockCalculation | null> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    UPDATE restock_calculations
    SET
      user_id = COALESCE(?, user_id),
      total_estimated_cost = COALESCE(?, total_estimated_cost)
    WHERE calculation_id = ?
    `,
    [
      input.userId ?? null,
      input.totalEstimatedCost ?? null,
      input.calculationId
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getRestockCalculationByIdWithConnection(
    input.calculationId,
    connection
  );
}

/**
 * ROUTE: PATCH /api/restock-calculations/:calculationId
 */
export async function updateRestockCalculation(
  input: UpdateRestockCalculationRepositoryInput
): Promise<RestockCalculation | null> {
  return withConnection(async connection => {
    return updateRestockCalculationWithConnection(input, connection);
  });
}

/**
 * TRANSACTION USE:
 * Useful if service needs to delete/rollback a specific calculation manually.
 */
export async function deleteRestockCalculationWithConnection(
  calculationId: number,
  connection: PoolConnection
): Promise<boolean> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    DELETE FROM restock_calculations
    WHERE calculation_id = ?
    `,
    [calculationId]
  );

  return result.affectedRows > 0;
}

/**
 * ROUTE: DELETE /api/restock-calculations/:calculationId
 */
export async function deleteRestockCalculation(
  calculationId: number
): Promise<boolean> {
  return withConnection(async connection => {
    return deleteRestockCalculationWithConnection(
      calculationId,
      connection
    );
  });
}
