import { z } from 'zod';
import { EMPLOYMENT_STATUS } from '../config/constants.js';


const decimalString = z
    .string()
    .regex(
        /^\d+(\.\d{2})?$/,
        "Must be a valid number or decimal with exactly 2 decimal places"
    );

export const employeeIdParamSchema = z.object({
    employeeId: z.coerce
        .number()
        .int()
        .positive("employeeId must be a positive integer")
});

export const registerEmployeeSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6),
    fullName: z.string().min(1),
    employeeCode: z.string().min(1),
    jobRole: z.string().min(1),
    defaultShiftHours: decimalString.optional(),
    hourlyRate: decimalString.optional()
});

export const updateEmployeeSchema = z.object({
    jobRole: z.string().optional(),
    defaultShiftHours: decimalString.optional(),
    hourlyRate: decimalString.optional(),
    employmentStatus: z.enum(Object.values(EMPLOYMENT_STATUS)).optional()
}).refine( data => Object.values(data).some(value => value !== undefined), {
    message: "At least one field must be provided for update."
});

