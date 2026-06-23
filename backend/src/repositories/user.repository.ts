import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from "mysql2/promise";

import type {
    User,
    CreateUserRepositoryInput,
} from "../models/index.js";


import { 
    USER_ROLES,
    ACCOUNT_STATUS,
    type UserRole,
    type AccountStatus
} from "../config/constants.js";

import { withConnection, withTransaction } from "../config/database.js";


type UserRow = RowDataPacket & {
    user_id: number;
    username: string;
    password_hash: string;
    full_name: string;
    role: UserRole;
    account_status: AccountStatus;
    created_at: Date;
    updated_at: Date | null;
};


// Helper Functions
function mapUserRow(row: UserRow): User {
    return {
        userId: row.user_id,
        username: row.username,
        passwordHash: row.password_hash,
        fullName: row.full_name,
        role: row.role,
        accountStatus: row.account_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Internal repository helper for fetching one user account using
 * an existing database connection.
 *
 * This is useful after INSERT operations so the repository can return
 * the full created user row, including generated fields such as user_id,
 * created_at, and updated_at.
 *
 * Returns null when no user account matches the given userId.
 */
async function getUserByIdWithConnection(
    connection: PoolConnection,
    userId: number
): Promise<User | null> {
    const [rows] = await connection.query<UserRow[]>(
        `
        SELECT *
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    return mapUserRow(row);
}

/**
 * ROUTE / USE CASE: POST /api/users
 *
 * Creates a user account.
 *
 * Important:
 * The service layer should receive the raw password from the frontend,
 * validate it, hash it, and then pass passwordHash to this repository.
 *
 * This repository should only insert the already-hashed password into
 * users.password_hash.
 */
export async function createUser(
    input: CreateUserRepositoryInput
): Promise<User> {
    return withTransaction(async (connection) => {
        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO users (
                username,
                password_hash,
                full_name,
                role,
                account_status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                input.username,
                input.passwordHash,
                input.fullName,
                input.role ?? USER_ROLES.EMPLOYEE,
                ACCOUNT_STATUS.ACTIVE
            ]
        );

        const user = await getUserByIdWithConnection(
            connection,
            result.insertId
        );

        if (user === null) {
            throw new Error("Created user account could not be found.");
        }

        return user;
    });
}


/**
 * ROUTE / USE CASE: GET /api/users/:userId
 *
 * Gets one user account by user_id.
 */
export async function getUserById(
    userId: number
): Promise<User | null> {
    return withConnection(async (connection) => {
        return getUserByIdWithConnection(connection, userId);
    });
}
