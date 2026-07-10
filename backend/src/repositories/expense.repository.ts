import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from 'mysql2/promise';

import type { 
    Expense, 
    CreateExpenseRepositoryInput 
} from '../models/index.js';
import type { ExpenseCategory } from '../config/constants.js';

import { withConnection } from '../config/database.js';

type ExpenseRow = RowDataPacket & {
    expense_id: number;
    sales_entry_id: number;
    description: string | null;
    amount: string;
    user_id: number | null;
    expense_category: ExpenseCategory;
    posted_at: Date;
    created_at: Date;
};

// Helper Functions
function mapExpenseRow(row: ExpenseRow): Expense {
    return {
        expenseId: row.expense_id,
        salesEntryId: row.sales_entry_id,
        description: row.description,
        amount: row.amount,
        userId: row.user_id,
        expenseCategory: row.expense_category,
        postedAt: row.posted_at,
        createdAt: row.created_at
    };
}

async function getExpenseByIdWithConnection(
    expenseId: number,
    connection: PoolConnection
): Promise<Expense | null> {
    const [rows] = await connection.query<ExpenseRow[]>(
        `
        SELECT * FROM expenses
        WHERE expense_id = ?
        LIMIT 1
        `
        ,
        [expenseId]
    );
    const row = rows[0];
    if (row === undefined) {
        return null;
    }
    return mapExpenseRow(row);
}

export async function getExpensesBySalesEntryIdWithConnection(
    salesEntryId: number,
    connection: PoolConnection
): Promise<Expense[]> {
    const [rows] = await connection.query<ExpenseRow[]>(
        `
        SELECT *
        FROM expenses
        WHERE sales_entry_id = ?
        ORDER BY expense_id ASC
        `,
        [salesEntryId]
    );

    return rows.map(mapExpenseRow);
}

/**
 * ROUTE: GET /api/expenses/
 */
export async function getAllExpenses(): Promise<Expense[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<ExpenseRow[]>(
            `
            SELECT * FROM expenses
            ORDER BY posted_at ASC
            `
        );
        return rows.map(mapExpenseRow);
    });
}

/**
 * ROUTE: GET /api/expenses/:expenseId
 */
export async function getExpenseById(
    expenseId: number
): Promise<Expense | null> {
    return withConnection(async (connection) => {
        return getExpenseByIdWithConnection(expenseId, connection);
    });
}

/**
 * ROUTE: POST /api/expenses/
 */
export async function createExpenseWithConnection(
    input: CreateExpenseRepositoryInput,
    connection: PoolConnection
): Promise<Expense | null> {
    const [result] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO expenses (
            sales_entry_id,
            description,
            amount,
            user_id,
            expense_category,
            posted_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        `
        ,
        [
            input.salesEntryId,
            input.description,
            input.amount,
            input.userId,
            input.expenseCategory,
            input.postedAt
        ]
    );
    const insertedExpenseId = result.insertId;
    const expense = await getExpenseByIdWithConnection(
        insertedExpenseId,
        connection
    );
    return expense;
}