import bcrypt from "bcrypt";

import type { Employee, RegisterEmployeeInput } from "../models/index.js";
import { USER_ROLES } from "../config/constants.js";

import { createUser } from "../repositories/user.repository.js";
import {
    createEmployee,
    getEmployees as getEmployeesFromRepository,
    getEmployeeById as getEmployeeByIdFromRepository
} from "../repositories/employee.repository.js";


/**
 * Registers an employee by creating a user account first,
 * then creating an employee profile using the generated userId.
 *
 * Flow:
 * 1. Hash raw password.
 * 2. Create user account.
 * 3. Use created user.userId.
 * 4. Create employee profile.
 * 5. Return created employee profile.
 */
export async function registerEmployee(
    input: RegisterEmployeeInput
): Promise<Employee> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await createUser({
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        role: USER_ROLES.EMPLOYEE
    });

    const employee = await createEmployee({
        userId: user.userId,
        employeeCode: input.employeeCode,
        jobRole: input.jobRole,
        defaultShiftHours: input.defaultShiftHours,
        hourlyRate: input.hourlyRate
    });

    return employee;
}

/**
 * Gets all employee profiles.
 */
export async function getEmployees(): Promise<Employee[]> {
    return getEmployeesFromRepository();
}

/**
 * Gets one employee profile by employeeId.
 */
export async function getEmployeeById(
    employeeId: number
): Promise<Employee | null> {
    return getEmployeeByIdFromRepository(employeeId);
}