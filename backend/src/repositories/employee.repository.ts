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

import { 
    EMPLOYMENT_STATUS,
    type EmploymentStatus
} from '../config/constants.js';

import { withConnection, withTransaction } from '../config/database.js';

type EmployeeRow = RowDataPacket & {
    employee_id: number;
    user_id: number;
    employee_code: string;
    job_role: string;
    default_shift_hours: string;
    hourly_rate: string;
    daily_pay: string;
    employment_status: EmploymentStatus;
    created_at: Date;
    updated_at: Date | null;
};


// Helper Functions
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
 * Internal repository helper for fetching one employee profile using
 * an existing database connection.
 *
 * This is used inside transactions so the INSERT/UPDATE query and the
 * follow-up SELECT query run on the same connection. This avoids opening
 * a separate connection while a transaction is still active.
 *
 * Returns null when no employee profile matches the given employeeId.
 */
async function getEmployeeByIdWithConnection(
    connection: PoolConnection,
    employeeId: number
): Promise<Employee | null> {
    const [rows] = await connection.query<EmployeeRow[]>(
        `
        SELECT * FROM employee_profiles
        WHERE employee_id = ?
        LIMIT 1
        `
        ,
        [employeeId]
    );

    const row = rows[0];
    if (row === undefined){
        return null;
    }

    return mapEmployeeRow(row);
}

/**
 * Shared repository function for employment status updates.
 */
async function updateEmployeeStatus(
    employeeId: number,
    employmentStatus: EmploymentStatus
): Promise<Employee | null> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            UPDATE employee_profiles
            SET employment_status = ?
            WHERE employee_id = ?
            `,
            [employmentStatus, employeeId]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return getEmployeeByIdWithConnection(connection, employeeId);
    });
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
        return getEmployeeByIdWithConnection(connection, employeeId);
    });
}


/**
 * ROUTE: POST /api/employees
 */
export async function createEmployee(
    input: CreateEmployeeInput
): Promise<Employee> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO employee_profiles (
                user_id,
                employee_code,
                job_role,
                default_shift_hours,
                hourly_rate
            )
            VALUES (?, ?, ?, ?, ?)
            `
            ,
            [
                input.userId,
                input.employeeCode,
                input.jobRole,
                input.defaultShiftHours,
                input.hourlyRate
            ]
        );
        const employee = await getEmployeeByIdWithConnection(
            connection, 
            result.insertId
        );

        if (employee === null) {
            throw new Error("Created employee profile could not be found.");
        }

        return employee;
    });
}


/**
 * ROUTE: PATCH /api/employees/:employeeId
 *
 * Updates employee profile fields only.
 * This does not update user account fields such as username,
 * password, full name, role, or account status.
 */
export async function updateEmployee(
    employeeId: number,
    input: UpdateEmployeeInput
): Promise<Employee | null> {
    return withTransaction(async (connection) => {
        const fields: string[] = [];
        const values: any[] = [];

        if (input.jobRole !== undefined) {
            fields.push("job_role = ?");
            values.push(input.jobRole);
        }

        if (input.defaultShiftHours !== undefined) {
            fields.push("default_shift_hours = ?");
            values.push(input.defaultShiftHours);
        }

        if (input.hourlyRate !== undefined) {
            fields.push("hourly_rate = ?");
            values.push(input.hourlyRate);
        }

        if (input.employmentStatus !== undefined) {
            fields.push("employment_status = ?");
            values.push(input.employmentStatus);
        }

        if (fields.length === 0) {
            return getEmployeeByIdWithConnection(connection, employeeId);
        }

        values.push(employeeId);

        const [result] = await connection.execute<ResultSetHeader>(
            `
            UPDATE employee_profiles
            SET ${fields.join(", ")}
            WHERE employee_id = ?
            `,
            values
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return getEmployeeByIdWithConnection(connection, employeeId);
    });
}

/**
 * ROUTE: PATCH /api/employees/:employeeId/activate
 *
 * Sets employment_status to active.
 */
export async function activateEmployee(
    employeeId: number
): Promise<Employee | null> {
    return updateEmployeeStatus(employeeId, EMPLOYMENT_STATUS.ACTIVE);
}

/**
 * ROUTE: PATCH /api/employees/:employeeId/deactivate
 *
 * Sets employment_status to inactive.
 */
export async function deactivateEmployee(
    employeeId: number
): Promise<Employee | null> {
    return updateEmployeeStatus(employeeId, EMPLOYMENT_STATUS.INACTIVE);
}


/**
 * ROUTE: DELETE /api/employees/:employeeId
 * 
 * Note:
 * This may fail if the employee already has related records such as
 * shifts, payroll entries, staff messages, or inventory requests.
 * In many cases, deactivateEmployee is safer than hard delete.
 */
export async function deleteEmployee(
    employeeId: number
): Promise<boolean> {
    return withConnection(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            DELETE FROM employee_profiles
            WHERE employee_id = ?
            `,
            [employeeId]
        );

        return result.affectedRows > 0;
    });
}
