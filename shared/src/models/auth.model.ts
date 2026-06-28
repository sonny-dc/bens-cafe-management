import { type UserRole } from '../constants/index.js';

export interface LoginInput {
    username: string;
    password: string;
}

export interface LoggedInUser {
    userId: number;
    username: string;
    fullName: string;
    role: UserRole;
    employeeId: number | null;
}