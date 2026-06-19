import type { EmploymentStatus } from "../config/constants.js";

export interface Employee {
    employeeId: number;
    userId: number;
    employeeCode: string;
    jobRole: string;
    defaultShiftHours: string;
    hourlyRate: string;
    dailyPay: string;
    employmentStatus: EmploymentStatus;
    createdAt: Date;
    updatedAt: Date | null;
}

export interface CreateEmployeeInput {
    userId: number;
    employeeCode: string;
    jobRole: string;
    defaultShiftHours: string;
    hourlyRate: string;
}

export interface UpdateEmployeeInput {
    jobRole?: string;
    defaultShiftHours?: string;
    hourlyRate?: string;
    employmentStatus?: EmploymentStatus;
}
