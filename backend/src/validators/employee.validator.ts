import { z } from 'zod';
import { nonNegativeDecimalString, positiveInt, hourlyRateSchema } from './common.validator.js';

import { EMPLOYMENT_STATUS } from '../config/constants.js';

export const employeeIdParamSchema = z.object({
    employeeId: positiveInt
});

export const registerEmployeeSchema = z.object({
    username: z.string().trim().min(1, 'Username must not be empty'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().trim().min(1, 'Full name must not be empty'),
    employeeCode: z.string().trim().min(1, 'Employee code must not be empty'),
    jobRole: z.string().trim().min(1, 'Job role must not be empty'),
    defaultShiftHours: nonNegativeDecimalString,
    hourlyRate: hourlyRateSchema
});

export const updateEmployeeSchema = z.object({
    jobRole: z.string().trim().min(1, 'Job role must not be empty').optional(),
    defaultShiftHours: nonNegativeDecimalString.optional(),
    hourlyRate: hourlyRateSchema.optional(),
    employmentStatus: z.enum(Object.values(EMPLOYMENT_STATUS)).optional()
}).refine( data => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update."
});

