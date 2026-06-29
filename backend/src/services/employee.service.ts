import type { Employee, EmployeeProfile, RegisterEmployeeInput, UpdateEmployeeInput } from "../models/index.js";
import { USER_ROLES } from "../config/constants.js";
import { userRepository, employeeRepository } from "../repositories/index.js";

import { withTransaction } from "../config/database.js";
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

    return withTransaction(async (connection) => {

        const user = await userRepository.createUserWithConnection({
            passwordHash,
            username: input.username,
            fullName: input.fullName,
            role: USER_ROLES.EMPLOYEE
        }, connection);

        const employee = await employeeRepository.createEmployeeWithConnection({
            userId: user.userId,
            employeeCode: input.employeeCode,
            jobRole: input.jobRole,
            defaultShiftHours: input.defaultShiftHours,
            hourlyRate: input.hourlyRate
        }, connection);
        
        return employee;

    });
}

/**
 * Gets all employee profiles.
 */
export async function getEmployees(): Promise<Employee[]> {
    return employeeRepository.getEmployees();
}

/**
 * Gets all employee profiles with additional user information.
 * This is useful for displaying employee information in the admin dashboard.
 */
export async function getEmployeeProfiles(): Promise<EmployeeProfile[]> {
    return employeeRepository.getEmployeeProfiles();
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
 * Gets one employee profile by userId.
 * This is useful for getting the employee profile of the currently logged-in user.
 */
export async function getEmployeeProfileByUserId(
    userId: number
): Promise<EmployeeProfile | null> {
    return employeeRepository.getEmployeeProfileByUserId(userId);
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
    return withTransaction(async (connection) => {
        const employee = await employeeRepository.getEmployeeByIdWithConnection(employeeId, connection);
        if (!employee) {
            return false;
        }
        const isEmployeeDeleted = await employeeRepository.deleteEmployee(employeeId, connection);
        if (!isEmployeeDeleted) {
            throw new Error(`Failed to delete employee with ID ${employeeId}`);
        }
        const isUserDeleted = await userRepository.deleteUserByIdWithConnection(employee.userId, connection);
        if (!isUserDeleted) {
            throw new Error(`Failed to delete user account for employee with ID ${employeeId}`);
        }

        return true;
    });
}
