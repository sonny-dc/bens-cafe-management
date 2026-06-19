import type { UserRole, AccountStatus } from '../config/constants.js';

export interface User {
    userId: number;
    username: string;
    passwordHash: string;
    fullName: string;
    role: UserRole;
    accountStatus: AccountStatus;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface CreateUserInput {
    username: string;
    password: string;
    fullName: string;
    role?: UserRole;
}
