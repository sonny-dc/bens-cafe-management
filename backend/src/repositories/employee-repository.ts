import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from 'mysql2/promise';

import type {
    Employee,
    CreateEmployeeInput,
    UpdateEmployeeInput
} from '../models/index.js';

import { withConnection, withTransaction } from '../config/database.js';

type EmployeeRow = Employee & RowDataPacket;

function mapEmployeeRow(row: EmployeeRow): Employee {
    return {
        employeeId: row.employee_id,
        userId: row.user_id,
        employeeCode: row.employee_code,
        jobRole: row.job_role,
        defaultShiftHours: row.default_shift_hours,
        hourlyRate: row.hourly_rate,
        dailyPay: row.daily_pay,
        employmentStatus: row.employment_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at  
    };
}

/**
 * ROUTE: GET /api/employees
 */
export async function getEmployees(): Promise<Employee[]>{
    return withConnection(async (connection) => {
        const [rows] = await connection.query<EmployeeRow[]>(
            `
            SELECT * FROM employee_profiles
            ORDER BY created_at DESC
            `
        );
        return rows.map(mapEmployeeRow);
    });
}

/**
 * ROUTE: GET /api/employees/:employeeId
 */
export async function getEmployeeById(
    employeeId: number
): Promise<Employee | null>{
    return withConnection(async (connection) => {
        const [rows] = await connection.query<EmployeeRow[]>(
            `
            SELECT * FROM employee_profiles
            WHERE employee_id = ?
            LIMIT 1
            `,
            [employeeId]
        );

        const row = rows[0];
        if (row === undefined) {
            return null;
        }

        return mapEmployeeRow(row);
    })
}


