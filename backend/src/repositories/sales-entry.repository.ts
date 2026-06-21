import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from 'mysql2/promise';

import type {
    SalesEntry,
    CreateSalesEntryInput
} from '../models/index.js';

import { withConnection, withTransaction } from '../config/database.js';

type SalesEntryRow = RowDataPacket & {
    sales_entry_id: number;
    cash_sales: string;
    online_card_sales: string;
    physical_cash_count: string | null;
    total_revenue: string;
    user_id: number | null;
    posted_at: Date;
    created_at: Date;
};

// Helper Functions
function mapSalesEntryRow(row: SalesEntryRow): SalesEntry {
    return {
        salesEntryId: row.sales_entry_id,
        cashSales: row.cash_sales,
        onlineCardSales: row.online_card_sales,
        physicalCashCount: row.physical_cash_count,
        totalRevenue: row.total_revenue,
        userId: row.user_id,
        postedAt: row.posted_at,
        createdAt: row.created_at
    };
}

/**
 * Internal repository helper for fetching one sales entry using
 * an existing database connection.
 */
async function getSalesEntryByIdWithConnection(
    connection: PoolConnection,
    salesEntryId: number
): Promise<SalesEntry | null> {
    const [rows] = await connection.query<SalesEntryRow[]>(
        `
        SELECT * FROM sales_entries
        WHERE sales_entry_id = ?
        LIMIT 1
        `
        ,
        [salesEntryId]
    );

    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    return mapSalesEntryRow(row);
}

/**
 * ROUTE: GET /api/sales-entries/
 */
export async function getAllSalesEntries(): Promise<SalesEntry[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<SalesEntryRow[]>(
            `
            SELECT * FROM sales_entries
            ORDER BY posted_at DESC
            `
        );
        return rows.map(mapSalesEntryRow);
    });
}

/**
 * ROUTE: GET /api/sales-entries/:salesEntryId
 */
export async function getSalesEntryById(
    salesEntryId: number
): Promise<SalesEntry | null> {
    return withConnection(async (connection) => {
        return getSalesEntryByIdWithConnection(connection, salesEntryId);
    });
}

/**
 * ROUTE: POST /api/sales-entries/
 */
export async function createSalesEntry(
    input: CreateSalesEntryInput
): Promise<SalesEntry> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO sales_entries (
                cash_sales, 
                online_card_sales, 
                physical_cash_count, 
                posted_at
            )
            VALUES (?, ?, ?, ?)
            `
            ,
            [
                input.cashSales, 
                input.onlineCardSales, 
                input.physicalCashCount, 
                input.postedAt
            ]
        );
        const salesEntry = await getSalesEntryByIdWithConnection(
            connection, 
            result.insertId
        );

        if (salesEntry === null) {
            throw new Error("Failed to retrieve the newly created sales entry.");
        }

        return salesEntry;
    });
}

