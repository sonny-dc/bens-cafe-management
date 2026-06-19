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

/**
 * Repository-level input for creating a user account.
 *
 * The raw password from the frontend should be handled only by the
 * service layer. The service validates the password, hashes it, then
 * passes passwordHash to the repository.
 *
 * The repository inserts passwordHash into users.password_hash and
 * should never receive or store the raw password.
 */
export interface CreateUserRepositoryInput {
    username: string;
    passwordHash: string;
    fullName: string;
    role?: UserRole;
}
