import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
  RestockCalculationItem,
  RestockCalculationItemWithInventoryDetails,
  CreateRestockCalculationItemRepositoryInput
} from '../models/index.js';

type RestockCalculationItemRow = RowDataPacket & {
  calculation_item_id: number;
  calculation_id: number;
  item_id: number | null;
  quantity_to_buy: string;
  unit_cost_snapshot: string;
  estimated_cost: string;
};

type RestockCalculationItemWithInventoryDetailsRow = RowDataPacket & {
  calculation_item_id: number;
  calculation_id: number;
  item_id: number | null;
  item_name: string | null;
  unit: string | null;
  quantity_to_buy: string;
  unit_cost_snapshot: string;
  estimated_cost: string;
};

function mapRestockCalculationItemRow(
  row: RestockCalculationItemRow
): RestockCalculationItem {
  return {
    calculationItemId: row.calculation_item_id,
    calculationId: row.calculation_id,
    itemId: row.item_id,
    quantityToBuy: row.quantity_to_buy,
    unitCostSnapshot: row.unit_cost_snapshot,
    estimatedCost: row.estimated_cost
  };
}

function mapRestockCalculationItemWithInventoryDetailsRow(
  row: RestockCalculationItemWithInventoryDetailsRow
): RestockCalculationItemWithInventoryDetails {
  return {
    calculationItemId: row.calculation_item_id,
    calculationId: row.calculation_id,
    itemId: row.item_id,
    itemName: row.item_name,
    unit: row.unit,
    quantityToBuy: row.quantity_to_buy,
    unitCostSnapshot: row.unit_cost_snapshot,
    estimatedCost: row.estimated_cost
  };
}

async function getRestockCalculationItemByIdWithConnection(
  calculationItemId: number,
  connection: PoolConnection
): Promise<RestockCalculationItem | null> {
  const [rows] = await connection.query<RestockCalculationItemRow[]>(
    `
    SELECT
      calculation_item_id,
      calculation_id,
      item_id,
      quantity_to_buy,
      unit_cost_snapshot,
      estimated_cost
    FROM restock_calculation_items
    WHERE calculation_item_id = ?
    LIMIT 1
    `,
    [calculationItemId]
  );

  const row = rows[0];

  if (row === undefined) {
    return null;
  }

  return mapRestockCalculationItemRow(row);
}

export async function createRestockCalculationItemWithConnection(
  input: CreateRestockCalculationItemRepositoryInput,
  connection: PoolConnection
): Promise<RestockCalculationItem> {
  const [result] = await connection.execute<ResultSetHeader>(
    `
    INSERT INTO restock_calculation_items (
      calculation_id,
      item_id,
      quantity_to_buy,
      unit_cost_snapshot
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      input.calculationId,
      input.itemId,
      input.quantityToBuy,
      input.unitCostSnapshot
    ]
  );

  const item = await getRestockCalculationItemByIdWithConnection(
    result.insertId,
    connection
  );

  if (item === null) {
    throw new Error('Failed to retrieve the newly created restock calculation item.');
  }

  return item;
}

export async function getRestockCalculationItemsByCalculationIdWithConnection(
  calculationId: number,
  connection: PoolConnection
): Promise<RestockCalculationItemWithInventoryDetails[]> {
  const [rows] = await connection.query<RestockCalculationItemWithInventoryDetailsRow[]>(
    `
    SELECT
      rci.calculation_item_id,
      rci.calculation_id,
      rci.item_id,
      ii.item_name,
      ii.unit,
      rci.quantity_to_buy,
      rci.unit_cost_snapshot,
      rci.estimated_cost
    FROM restock_calculation_items rci
    LEFT JOIN inventory_items ii
      ON ii.item_id = rci.item_id
    WHERE rci.calculation_id = ?
    ORDER BY rci.calculation_item_id ASC
    `,
    [calculationId]
  );

  return rows.map(mapRestockCalculationItemWithInventoryDetailsRow);
}

export async function getRestockCalculationItemsByCalculationId(
  calculationId: number
): Promise<RestockCalculationItemWithInventoryDetails[]> {
  return withConnection(async connection => {
    return getRestockCalculationItemsByCalculationIdWithConnection(
      calculationId,
      connection
    );
  });
}
