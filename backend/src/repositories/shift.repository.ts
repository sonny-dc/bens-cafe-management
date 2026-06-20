import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import type {
    Shift,
    StartShiftInput,
    EndShiftInput
} from '../models/index.js';

import type { ShiftStatus } from '../config/constants.js';
import { SHIFT_STATUS } from '../config/constants.js';
import { withConnection, withTransaction } from '../config/database.js';

type ShiftSessionRow = RowDataPacket & {
    shift_id: number;
    employee_id: number;
    shift_date: Date;
    start_time: Date;
    scheduled_end_time: Date | null;
    end_time: Date | null;
    opening_cash: string;
    closing_cash: string;
    recorded_cash_sales: string | null;
    cash_variance: string | null;
    shift_status: ShiftStatus;
    created_at: Date;
    updated_at: Date | null;
};

// Helper Functions
function mapShiftRow(row: ShiftSessionRow): Shift {
    return {
        shiftId: row.shift_id,
        employeeId: row.employee_id,
        shiftDate: row.shift_date,
        startTime: row.start_time,
        scheduledEndTime: row.scheduled_end_time,
        endTime: row.end_time,
        openingCash: row.opening_cash,
        closingCash: row.closing_cash,
        recordedCashSales: row.recorded_cash_sales,
        cashVariance: row.cash_variance,
        status: row.shift_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

async function getShiftByIdWithConnection(
    connection: PoolConnection,
    shiftId: number
): Promise<Shift | null> {
    const [rows] = await connection.query<ShiftSessionRow[]>(
        `
        SELECT * FROM shift_sessions
        WHERE shift_id = ?
        LIMIT 1
        `,
        [shiftId]
    );

    const row = rows[0];
    if (row === undefined) {
        return null;
    }

    return mapShiftRow(row);
}

export async function getActiveShiftByEmployee(
    employeeId: number
): Promise<Shift | null> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<ShiftSessionRow[]>(
            `
            SELECT * FROM shift_sessions
            WHERE employee_id = ? AND shift_status = ?
            LIMIT 1
            `,
            [
                employeeId, 
                SHIFT_STATUS.IN_PROGRESS
            ]
        );

        const row = rows[0];
        if (row === undefined) {
            return null;
        }

        return mapShiftRow(row);
    });
}

export async function getShiftById(
    shiftId: number
): Promise<Shift | null> {
    return withConnection(async (connection) => {
        return getShiftByIdWithConnection(connection, shiftId);
    });
}

export async function startShift(
    input: StartShiftInput
): Promise<Shift> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO shift_sessions (
                employee_id,
                start_time,
                opening_cash,
                shift_status
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                input.employeeId,
                input.startTime,
                input.openingCash,
                SHIFT_STATUS.IN_PROGRESS
            ]
        );

        const shift = await getShiftByIdWithConnection(
            connection,
            result.insertId
        );

        if (shift === null) {
            throw new Error("Created shift could not be found.");
        }

        return shift;
    });
}

export async function endShift(
    shiftId: number,
    input: EndShiftInput
): Promise<Shift | null> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            UPDATE shift_sessions
            SET 
                end_time = ?,
                closing_cash = ?,
                shift_status = ?
            WHERE shift_id = ? AND shift_status = ?
            `,
            [
                input.endTime, 
                input.closingCash, 
                SHIFT_STATUS.COMPLETED, 
                shiftId, 
                SHIFT_STATUS.IN_PROGRESS
            ]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return getShiftByIdWithConnection(connection, shiftId);
    });
}
