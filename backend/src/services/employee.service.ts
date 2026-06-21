import type { Employee, RegisterEmployeeInput, UpdateEmployeeInput } from "../models/index.js";
import { USER_ROLES } from "../config/constants.js";
import { userRepository, employeeRepository } from "../repositories/index.js";

import { hashPassword } from "../utils/password-hash.js";


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
    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.createUser({
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        role: USER_ROLES.EMPLOYEE
    });

    const employee = await employeeRepository.createEmployee({
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
    return employeeRepository.getEmployees();
}
 
/**
 * Gets one employee profile by employeeId.
 */
export async function getEmployeeById(
    employeeId: number
): Promise<Employee | null> {
    return await employeeRepository.getEmployeeById(employeeId);
}

/**
 * Best for updating multiple fields at once, but can also be used for updating just one field.
 */
export async function updateEmployee(
    employeeId: number,
    input: UpdateEmployeeInput
): Promise<Employee | null> {
    return await employeeRepository.updateEmployee(employeeId, input);
}

/**
 * Sets employee's employment_status to 'active'.
 * best for buttons that toggle activation of an employee.
 */
export async function activateEmployee(employeeId: number): Promise<Employee | null> {
    return await employeeRepository.activateEmployee(employeeId);
}

/**
 * Sets employee's employment_status to 'inactive'.
 * best for buttons that toggle deactivation of an employee.
 */
export async function deactivateEmployee(employeeId: number): Promise<Employee | null> {
    return await employeeRepository.deactivateEmployee(employeeId);
}

/**
 * Deletes an employee profile permanently from the database. Use with caution.
 * Also deletes the associated user account.
 */
export async function deleteEmployee(employeeId: number): Promise<boolean> {
    return await employeeRepository.deleteEmployee(employeeId);
}