import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import type {
    Shift,
    StaffWeeklyPerformance,
    StartShiftRepositoryInput,
    EndShiftRepositoryInput
} from '../models/index.js';

import { 
    SHIFT_STATUS,
    EMPLOYMENT_STATUS,
    type ShiftStatus
} from '../config/constants.js';

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

type StaffWeeklyPerformanceRow = RowDataPacket & {
  employee_id: number;
  full_name: string;
  job_role: string;
  total_cash: string;
  completed_shifts: number;
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

function mapStaffWeeklyPerformanceRow(
  row: StaffWeeklyPerformanceRow
): StaffWeeklyPerformance {
  return {
    employeeId: row.employee_id,
    fullName: row.full_name,
    jobRole: row.job_role,
    totalCash: row.total_cash,
    completedShifts: row.completed_shifts
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

export async function getAllActiveShifts(): Promise<any[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<RowDataPacket[]>(
            `
            SELECT 
                s.shift_id as id,
                e.employee_id as employeeId,
                u.full_name as name,
                e.job_role as role,
                s.start_time as clockInTime
            FROM shift_sessions s
            JOIN employee_profiles e ON s.employee_id = e.employee_id
            JOIN users u ON e.user_id = u.user_id
            WHERE s.shift_status = ?
            ORDER BY s.start_time DESC
            `,
            [SHIFT_STATUS.IN_PROGRESS]
        );
        return rows as any[];
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
    input: StartShiftRepositoryInput
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
    employeeId: number,
    input: EndShiftRepositoryInput
): Promise<Shift | null> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            UPDATE shift_sessions
            SET 
                end_time = ?,
                closing_cash = ?,
                shift_status = ?
            WHERE shift_id = ? AND employee_id = ? AND shift_status = ?
            `,
            [
                input.endTime, 
                input.closingCash, 
                SHIFT_STATUS.COMPLETED, 
                shiftId, 
                employeeId,
                SHIFT_STATUS.IN_PROGRESS
            ]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return getShiftByIdWithConnection(connection, shiftId);
    });
}

export async function getShiftSummary(startDate: string, endDate: string): Promise<Shift[]> {
    return withConnection(async (connection) => {
        const [rows] = await connection.query<ShiftSessionRow[]>(
            `
            SELECT * FROM shift_sessions
            WHERE shift_date >= ? AND shift_date <= ?
            AND shift_status != ?
            ORDER BY shift_date DESC, start_time DESC
            `,
            [startDate, endDate, SHIFT_STATUS.ARCHIVED]
        );
        return rows.map(mapShiftRow);
    });
}

export async function getStaffWeeklyPerformance(
  startDate: string,
  endDate: string
): Promise<StaffWeeklyPerformance[]> {
  return withConnection(async (connection) => {
    const [rows] = await connection.query<StaffWeeklyPerformanceRow[]>(
      `
      SELECT
        e.employee_id,
        u.full_name,
        e.job_role,
        COALESCE(SUM(s.closing_cash), 0) AS total_cash,
        COUNT(s.shift_id) AS completed_shifts
      FROM employee_profiles e
      JOIN users u
        ON e.user_id = u.user_id
      LEFT JOIN shift_sessions s
        ON e.employee_id = s.employee_id
        AND s.shift_status = ?
        AND s.shift_date >= ?
        AND s.shift_date < ?
      WHERE e.employment_status = ?
      GROUP BY
        e.employee_id,
        u.full_name,
        e.job_role
      ORDER BY total_cash DESC
      `,
      [
        SHIFT_STATUS.COMPLETED,
        startDate,
        endDate,
        EMPLOYMENT_STATUS.ACTIVE
      ]
    );

    return rows.map(mapStaffWeeklyPerformanceRow);
  });
}

export async function archiveShiftsByDateRange(startDate: string, endDate: string): Promise<number> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            UPDATE shift_sessions
            SET shift_status = ?
            WHERE shift_date >= ? AND shift_date <= ?
            AND shift_status = ?
            `,
            [SHIFT_STATUS.ARCHIVED, startDate, endDate, SHIFT_STATUS.COMPLETED]
        );
        return result.affectedRows;
    });
}
