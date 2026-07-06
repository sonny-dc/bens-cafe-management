import type { LoginInput, LoggedInUser } from '../models/index.js';
import { userRepository, employeeRepository } from '../repositories/index.js';
import { verifyPassword } from '../utils/password-hash.js';
import { USER_ROLES, ACCOUNT_STATUS, EMPLOYMENT_STATUS } from '../config/constants.js';
import { withTransaction } from '../config/database.js';

import {

    // User Errors
    InactiveUserError,

    // Employee Errors
    EmployeeNotFoundError,
    InactiveEmployeeError,

    // Auth Errors
    InvalidCredentialsError,

} from '../errors/index.js';

export async function loginUser(
    loginInput: LoginInput
): Promise<LoggedInUser> {
    return withTransaction(async (connection) => {
        const user = await userRepository.getUserByUsernameWithConnection(
            loginInput.username,
            connection
        );
        if (!user) throw new InvalidCredentialsError();

        const passwordMatch = await verifyPassword(
            loginInput.password,
            user.passwordHash
        );
        if (!passwordMatch) throw new InvalidCredentialsError();
        
        if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) throw new InactiveUserError();
        
        let employeeId: number | null = null;
        if (user.role === USER_ROLES.EMPLOYEE){
            const employee = await employeeRepository.getEmployeeByUserIdWithConnection(
                user.userId,
                connection
            );
            if (!employee) throw new EmployeeNotFoundError('Employee profile not found');
            if (employee.employmentStatus !== EMPLOYMENT_STATUS.ACTIVE) throw new InactiveEmployeeError('Employee profile is inactive');
            
            employeeId = employee.employeeId;
        }
        return {
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            employeeId: employeeId
        };
    });
}
