import type { Employee, RegisterEmployeeInput, UpdateEmployeeInput } from "../models/index.js";
import { USER_ROLES } from "../config/constants.js";
import { userRepository, employeeRepository } from "../repositories/index.js";

import { hashPassword } from "../utils/password-hash.js";


// Helper functions
function validateEmployeeId(employeeId: number): void {
    if (isNaN(employeeId)) {
        throw new Error("Invalid employeeId parameter.");
    }
}

function throwIfEmployeeNotFound(employee: Employee | null): void {
    if (employee === null) {
        throw new Error("Employee not found.");
    }
}

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
    validateEmployeeId(employeeId);
    const employee: Employee | null = await employeeRepository.getEmployeeById(employeeId);
    throwIfEmployeeNotFound(employee);

    return employee;
}

/**
 * Best for updating multiple fields at once, but can also be used for updating just one field.
 */
export async function updateEmployee(
    employeeId: number,
    input: UpdateEmployeeInput
): Promise<Employee | null> {
    validateEmployeeId(employeeId);
    const updatedEmployee: Employee | null = await employeeRepository.updateEmployee(employeeId, input);
    throwIfEmployeeNotFound(updatedEmployee);

    return updatedEmployee;
}

/**
 * Sets employee's employment_status to 'active'.
 * best for buttons that toggle activation of an employee.
 */
export async function activateEmployee(employeeId: number): Promise<Employee | null> {
    validateEmployeeId(employeeId);
    const activatedEmployee: Employee | null = await employeeRepository.activateEmployee(employeeId);
    throwIfEmployeeNotFound(activatedEmployee);

    return activatedEmployee;
}

/**
 * Sets employee's employment_status to 'inactive'.
 * best for buttons that toggle deactivation of an employee.
 */
export async function deactivateEmployee(employeeId: number): Promise<Employee | null> {
    validateEmployeeId(employeeId);
    const deactivatedEmployee: Employee | null = await employeeRepository.deactivateEmployee(employeeId);
    throwIfEmployeeNotFound(deactivatedEmployee);

    return deactivatedEmployee;
}