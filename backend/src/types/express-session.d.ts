import 'express-session';
import { type UserRole } from '../config/constants.js';

declare module 'express-session' {
    /**
     * Extends the default session data interface to include user information.
     * Used for storing authenticated user details in the session table.
     * This allows the application to access user information from the session.
     * The user object includes userId, username, fullName, role, and optionally employeeId.
     */
    interface SessionData {
        user?: {
            userId: number;
            username: string;
            fullName: string;
            role: UserRole;
            employeeId: number | null;
        };
    }
}
