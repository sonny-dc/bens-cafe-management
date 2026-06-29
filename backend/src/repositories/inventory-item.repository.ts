import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';

import { withConnection } from '../config/database.js';

import type {
    InventoryItem,
    InventoryItemListItem,
    InventoryItemOption,
    CreateInventoryItemRepositoryInput,
    UpdateInventoryItemRepositoryInput
} from '../models/index.js';

import type {
    InventoryItemCategory,
    InventoryItemStatus
} from '../config/constants.js';

type InventoryItemRow = RowDataPacket & {
    item_id: number;
    item_name: string;
    category: InventoryItemCategory;
    unit: string;
    stock_quantity: string;
    low_threshold: string;
    unit_cost: string;
    status: InventoryItemStatus;
    user_id: number | null;
    created_at: Date;
    updated_at: Date | null;
};

type InventoryItemListRow = RowDataPacket & {
    item_id: number;
    item_name: string;
    category: InventoryItemCategory;
    unit: string;
    stock_quantity: string;
    low_threshold: string;
    unit_cost: string;
    status: InventoryItemStatus;
};

type InventoryItemOptionRow = RowDataPacket & {
    item_id: number;
    item_name: string;
    unit: string;
    stock_quantity: string;
};

function mapInventoryItemRow(row: InventoryItemRow): InventoryItem {
    return {
      itemId: row.item_id,
      itemName: row.item_name,
      category: row.category,
      unit: row.unit,
      stockQuantity: row.stock_quantity,
      lowThreshold: row.low_threshold,
      unitCost: row.unit_cost,
      status: row.status,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
}

function mapInventoryItemListRow(row: InventoryItemListRow): InventoryItemListItem {
    return {
      itemId: row.item_id,
      itemName: row.item_name,
      category: row.category,
      unit: row.unit,
      stockQty: Number(row.stock_quantity),
      threshold: Number(row.low_threshold),
      unitCost: Number(row.unit_cost),
      status: row.status
    };
}

function mapInventoryItemOptionRow(row: InventoryItemOptionRow): InventoryItemOption {
    return {
      itemId: row.item_id,
      itemName: row.item_name,
      unit: row.unit,
      stockQuantity: row.stock_quantity
    };
}

async function getInventoryItemByIdWithConnection(
  itemId: number,
  connection: PoolConnection
): Promise<InventoryItem | null> {
    const [rows] = await connection.query<InventoryItemRow[]>(
      `
      SELECT *
      FROM inventory_items
      WHERE item_id = ?
      LIMIT 1
      `,
      [itemId]
    );

    const row = rows[0];

    if (row === undefined) {
      return null;
    }

    return mapInventoryItemRow(row);
}

/**
 * ROUTE: GET /api/inventory-items
 */
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
    return withConnection(async connection => {
      const [rows] = await connection.query<InventoryItemRow[]>(
        `
        SELECT *
        FROM inventory_items
        ORDER BY item_name ASC
        `
      );

      return rows.map(mapInventoryItemRow);
    });
}

/**
 * ROUTE: GET /api/inventory-items/list
 */
export async function getInventoryItemList(): Promise<InventoryItemListItem[]> {
    return withConnection(async connection => {
      const [rows] = await connection.query<InventoryItemListRow[]>(
        `
        SELECT
          item_id,
          item_name,
          category,
          unit,
          stock_quantity,
          low_threshold,
          unit_cost,
          status
        FROM inventory_items
        ORDER BY item_name ASC
        `
      );

      return rows.map(mapInventoryItemListRow);
    });
}

/**
 * ROUTE: GET /api/inventory-items/options
 */
export async function getInventoryItemOptions(): Promise<InventoryItemOption[]> {
    return withConnection(async connection => {
      const [rows] = await connection.query<InventoryItemOptionRow[]>(
        `
        SELECT
          item_id,
          item_name,
          unit,
          stock_quantity
        FROM inventory_items
        ORDER BY item_name ASC
        `
      );

      return rows.map(mapInventoryItemOptionRow);
    });
}

/**
 * ROUTE: GET /api/inventory-items/:itemId
 */
export async function getInventoryItemById(
  itemId: number
): Promise<InventoryItem | null> {
    return withConnection(async connection => {
      return getInventoryItemByIdWithConnection(itemId, connection);
    });
}

/**
 * ROUTE: POST /api/inventory-items
 */
export async function createInventoryItem(
  input: CreateInventoryItemRepositoryInput
): Promise<InventoryItem> {
    return withConnection(async connection => {
      const [result] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO inventory_items (
          item_name,
          category,
          unit,
          stock_quantity,
          low_threshold,
          unit_cost,
          status,
          user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          input.itemName,
          input.category,
          input.unit,
          input.stockQuantity,
          input.lowThreshold,
          input.unitCost,
          input.status,
          input.userId
        ]
      );

      const inventoryItem = await getInventoryItemByIdWithConnection(
        result.insertId,
        connection
      );

      if (inventoryItem === null) {
        throw new Error('Failed to retrieve the newly created inventory item.');
      }

      return inventoryItem;
    });
}

/**
 * ROUTE: PATCH /api/inventory-items/:itemId
 */
export async function updateInventoryItem(
  input: UpdateInventoryItemRepositoryInput
): Promise<InventoryItem | null> {
    return withConnection(async connection => {
      const [result] = await connection.execute<ResultSetHeader>(
        `
        UPDATE inventory_items
        SET
          item_name = COALESCE(?, item_name),
          category = COALESCE(?, category),
          unit = COALESCE(?, unit),
          stock_quantity = COALESCE(?, stock_quantity),
          low_threshold = COALESCE(?, low_threshold),
          unit_cost = COALESCE(?, unit_cost),
          status = ?,
          user_id = ?
        WHERE item_id = ?
        `,
        [
          input.itemName ?? null,
          input.category ?? null,
          input.unit ?? null,
          input.stockQuantity ?? null,
          input.lowThreshold ?? null,
          input.unitCost ?? null,
          input.status ?? null,
          input.userId ?? null,
          input.itemId
        ]
      );

      if (result.affectedRows === 0) {
        return null;
      }

      return getInventoryItemByIdWithConnection(input.itemId, connection);
    });
}

/**
 * ROUTE: DELETE /api/inventory-items/:itemId
 */
export async function deleteInventoryItem(
  itemId: number
): Promise<boolean> {
    return withConnection(async connection => {
      const [result] = await connection.execute<ResultSetHeader>(
        `
        DELETE FROM inventory_items
        WHERE item_id = ?
        `,
        [itemId]
      );

      return result.affectedRows > 0;
    });
}
