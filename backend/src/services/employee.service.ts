import type { Employee, EmployeeProfile, RegisterEmployeeInput, UpdateEmployeeInput } from "../models/index.js";
import { USER_ROLES, EMPLOYMENT_STATUS } from "../config/constants.js";
import { userRepository, employeeRepository, shiftRepository } from "../repositories/index.js";

import { withTransaction } from "../config/database.js";
import { hashPassword } from "../utils/password-hash.js";

import {
    EmployeeNotFoundError,
    EmployeeDeletionError,
    EmployeeAlreadyExistsError,
    EmployeeStatusError,
    EmployeeUpdateError
} from "../errors/index.js";


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

        const isExistingUser = await userRepository.getUserByUsernameWithConnection(input.username, connection);
        if (isExistingUser) {
            throw new EmployeeAlreadyExistsError(`Username already exists`);
        }

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
): Promise<Employee> {
    const employee = await employeeRepository.getEmployeeById(employeeId);
    if (!employee) {
        throw new EmployeeNotFoundError();
    }
    return employee;
}

/**
 * Gets one employee profile by userId.
 * This is useful for getting the employee profile of the currently logged-in user.
 */
export async function getEmployeeProfileByUserId(
    userId: number
): Promise<EmployeeProfile> {
    const employeeProfile = await employeeRepository.getEmployeeProfileByUserId(userId);
    if (!employeeProfile) {
        throw new EmployeeNotFoundError();
    }
    return employeeProfile;
}

/**
 * Best for updating multiple fields at once, but can also be used for updating just one field.
 */
export async function updateEmployee(
    employeeId: number,
    input: UpdateEmployeeInput
): Promise<Employee> {
    return withTransaction(async (connection) => {
        const employee = await employeeRepository.getEmployeeByIdWithConnection(
            employeeId,
            connection
        );

        if (!employee) {
            throw new EmployeeNotFoundError();
        }

        if (input.employmentStatus === EMPLOYMENT_STATUS.INACTIVE) {
            if (employee.employmentStatus === EMPLOYMENT_STATUS.INACTIVE) {
                throw new EmployeeStatusError(
                    'Cannot deactivate employee because they are already inactive'
                );
            }

            const hasActiveShift =
                await shiftRepository.hasActiveShiftByEmployeeWithConnection(
                    connection,
                    employeeId
                );

            if (hasActiveShift) {
                throw new EmployeeStatusError(
                    'Cannot deactivate employee with an active shift'
                );
            }
        }

        if (input.employmentStatus === EMPLOYMENT_STATUS.ACTIVE) {
            if (employee.employmentStatus === EMPLOYMENT_STATUS.ACTIVE) {
                throw new EmployeeStatusError(
                    'Cannot activate employee because they are already active'
                );
            }
        }

        const updatedEmployee =
            await employeeRepository.updateEmployeeWithConnection(
                employeeId,
                input,
                connection
            );

        if (!updatedEmployee) {
            throw new EmployeeUpdateError(
                `Failed to update employee with ID ${employeeId}`
            );
        }

        return updatedEmployee;
    });
}

/**
 * Sets employee's employment_status to 'active'.
 * best for buttons that toggle activation of an employee.
 */
export async function activateEmployee(employeeId: number): Promise<Employee> {
    return withTransaction(async (connection) => {
        const employee = await employeeRepository.getEmployeeByIdWithConnection(employeeId, connection);
        if (!employee) {
            throw new EmployeeNotFoundError();
        }
        if (employee.employmentStatus === EMPLOYMENT_STATUS.ACTIVE) {
            throw new EmployeeStatusError('Cannot activate employee because they are already active');
        }
        const activatedEmployee = await employeeRepository.activateEmployeeWithConnection(employeeId, connection);
        if (!activatedEmployee) {
            throw new EmployeeUpdateError(`Failed to activate employee`);
        }
        return activatedEmployee;
    });
}

/**
 * Sets employee's employment_status to 'inactive'.
 * best for buttons that toggle deactivation of an employee.
 */
export async function deactivateEmployee(employeeId: number): Promise<Employee> {
    return withTransaction(async (connection) => {
        const employee = await employeeRepository.getEmployeeByIdWithConnection(employeeId, connection);
        if (!employee) {
            throw new EmployeeNotFoundError();
        }
        if (employee.employmentStatus === EMPLOYMENT_STATUS.INACTIVE) {
            throw new EmployeeStatusError('Cannot deactivate employee because they are already inactive');
        }

        const hasActiveShift = await shiftRepository.hasActiveShiftByEmployeeWithConnection(connection, employeeId);
        if (hasActiveShift) {
            throw new EmployeeStatusError('Cannot deactivate employee with an active shift');
        }

        const deactivatedEmployee = await employeeRepository.deactivateEmployeeWithConnection(employeeId, connection);
        if (!deactivatedEmployee) {
            throw new EmployeeUpdateError(`Failed to deactivate employee`);
        }
        return deactivatedEmployee;
    });
}

/**
 * Deletes an employee profile permanently from the database. Use with caution.
 * Also deletes the associated user account.
 */
export async function deleteEmployee(employeeId: number): Promise<void> {
    return withTransaction(async (connection) => {
        const employee = await employeeRepository.getEmployeeByIdWithConnection(employeeId, connection);
        if (!employee) {
            throw new EmployeeNotFoundError();
        }
        const isEmployeeDeleted = await employeeRepository.deleteEmployee(employeeId, connection);
        if (!isEmployeeDeleted) {
            throw new EmployeeDeletionError(`Failed to delete employee with ID ${employeeId}`);
        }
        const isUserDeleted = await userRepository.deleteUserByIdWithConnection(employee.userId, connection);
        if (!isUserDeleted) {
            throw new EmployeeDeletionError(`Failed to delete user account for employee with ID ${employeeId}`);
        }
    });
}
