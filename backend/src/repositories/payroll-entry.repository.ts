import {
    type CreatePayrollEntryRepositoryInput,
    type PayrollEntry 
} from "../models/index.js";

import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2/promise";
import { withConnection } from "../config/database.js";

type PayrollEntryRow = RowDataPacket & {
    payroll_id: number;
    sales_entry_id: number;
    employee_id: number;
    gross_pay: string;
    posted_at: Date;
    created_at: Date;
};

function mapPayrollEntryRow(row: PayrollEntryRow): PayrollEntry {
    return {
        payrollEntryId: row.payroll_id,
        salesEntryId: row.sales_entry_id,
        employeeId: row.employee_id,
        grossPay: row.gross_pay,
        postedAt: row.posted_at,
        createdAt: row.created_at,
    };
}

export async function getPayrollEntriesByIdWithConnection(
    payrollEntryId: number,
    connection: PoolConnection
): Promise<PayrollEntry | null> {
    const [rows] = await connection.query<PayrollEntryRow[]>(
        `
        SELECT * FROM payroll_entries
        WHERE payroll_id = ?
        LIMIT 1
        `,
        [payrollEntryId]
    );
    const row = rows[0];
    if (row === undefined) {
        return null;
    }
    return mapPayrollEntryRow(row);
}

/**
 * ROUTE: GET /api/payroll-entries
 */
export async function getAllPayrollEntries(): Promise<PayrollEntry[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<PayrollEntryRow[]>(
            `
            SELECT * FROM payroll_entries
            ORDER BY created_at ASC
            `
        );
        return rows.map(mapPayrollEntryRow);
    });
}

/**
 * ROUTE: GET /api/payroll-entries/:payrollEntryId
 */
export async function getPayrollEntryById(
    payrollEntryId: number
): Promise<PayrollEntry | null> {
    return withConnection(async (connection) => {
        return getPayrollEntriesByIdWithConnection(payrollEntryId, connection);
    });
}

/**
 * ROUTE: POST /api/payroll-entries/
 */
export async function createPayrollEntryWithConnection(
    input: CreatePayrollEntryRepositoryInput,
    connection: PoolConnection
): Promise<PayrollEntry | null> {
    const [result] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO payroll_entries (sales_entry_id, employee_id, gross_pay, posted_at)
        VALUES (?, ?, ?, ?)
        `,
        [
            input.salesEntryId,
            input.employeeId,
            input.grossPay,
            input.postedAt
        ]
    );
    const payrollEntry = await getPayrollEntriesByIdWithConnection(
        result.insertId, 
        connection
    );

    return payrollEntry;
}
