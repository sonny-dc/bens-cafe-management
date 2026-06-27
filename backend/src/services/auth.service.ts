import type { LoginInput, LoggedInUser } from '../models/index.js';
import { userRepository, employeeRepository } from '../repositories/index.js';
import { verifyPassword } from '../utils/password-hash.js';
import { USER_ROLES, ACCOUNT_STATUS, EMPLOYMENT_STATUS } from '../config/constants.js';
import { withTransaction } from '../config/database.js';

export async function loginUser(
    loginInput: LoginInput
): Promise<LoggedInUser | null> {
    return withTransaction(async (connection) => {
        const user = await userRepository.getUserByUsernameWithConnection(
            loginInput.username,
            connection
        );
        if (!user) return null;

        if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) throw new Error('This account is inactive.');
        const passwordMatch = await verifyPassword(
            loginInput.password,
            user.passwordHash
        );
        if (!passwordMatch) return null;

        let employeeId: number | null = null;
        if (user.role === USER_ROLES.EMPLOYEE){
            const employee = await employeeRepository.getEmployeeByUserIdWithConnection(
                user.userId,
                connection
            );
            if (!employee) throw new Error('Employee profile not found');
            if (employee.employmentStatus !== EMPLOYMENT_STATUS.ACTIVE) throw new Error('Employee profile is inactive.');
            
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
