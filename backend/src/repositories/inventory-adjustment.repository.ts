import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
  InventoryAdjustment,
  CreateInventoryAdjustmentRepositoryInput
} from '../models/index.js';

import type { InventoryAdjustmentType } from '../config/constants.js';

type InventoryAdjustmentRow = RowDataPacket & {
  adjustment_id: number;
  item_id: number | null;
  user_id: number | null;
  adjustment_type: InventoryAdjustmentType;
  quantity_changed: string;
  old_quantity: string;
  new_quantity: string;
  reason: string | null;
  created_at: Date;
};

function mapInventoryAdjustmentRow(
  row: InventoryAdjustmentRow
): InventoryAdjustment {
  return {
    adjustmentId: row.adjustment_id,
    itemId: row.item_id,
    userId: row.user_id,
    adjustmentType: row.adjustment_type,
    quantityChanged: row.quantity_changed,
    oldQuantity: row.old_quantity,
    newQuantity: row.new_quantity,
    reason: row.reason,
    createdAt: row.created_at
  };
}

async function getInventoryAdjustmentByIdWithConnection(
  adjustmentId: number,
  connection: PoolConnection
): Promise<InventoryAdjustment | null> {
  const [rows] = await connection.query<InventoryAdjustmentRow[]>(
    `
    SELECT
      adjustment_id,
      item_id,
      user_id,
      adjustment_type,
      quantity_changed,
      old_quantity,
      new_quantity,
      reason,
      created_at
    FROM inventory_adjustments
    WHERE adjustment_id = ?
    LIMIT 1
    `,
    [adjustmentId]
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapInventoryAdjustmentRow(row);
}

export async function createInventoryAdjustmentWithConnection(
  input: CreateInventoryAdjustmentRepositoryInput,
  connection: PoolConnection
): Promise<InventoryAdjustment> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    INSERT INTO inventory_adjustments (
      item_id,
      user_id,
      adjustment_type,
      quantity_changed,
      old_quantity,
      new_quantity,
      reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.itemId,
      input.userId,
      input.adjustmentType,
      input.quantityChanged,
      input.oldQuantity,
      input.newQuantity,
      input.reason
    ]
  );

  const adjustment = await getInventoryAdjustmentByIdWithConnection(
    result.insertId,
    connection
  );

  if (adjustment === null) {
    throw new Error('Failed to retrieve the newly created inventory adjustment.');
  }

  return adjustment;
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentRepositoryInput
): Promise<InventoryAdjustment> {
  return withConnection(async connection => {
    return createInventoryAdjustmentWithConnection(input, connection);
  });
}

export async function getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
  return withConnection(async connection => {
    const [rows] = await connection.query<InventoryAdjustmentRow[]>(
      `
      SELECT
        adjustment_id,
        item_id,
        user_id,
        adjustment_type,
        quantity_changed,
        old_quantity,
        new_quantity,
        reason,
        created_at
      FROM inventory_adjustments
      ORDER BY created_at DESC, adjustment_id DESC
      `
    );

    return rows.map(mapInventoryAdjustmentRow);
  });
}
