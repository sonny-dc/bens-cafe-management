import { z } from 'zod';
import { nonNegativeDecimalString, positiveInt } from './common.validator.js';

import { EMPLOYMENT_STATUS } from '../config/constants.js';

export const employeeIdParamSchema = z.object({
    employeeId: positiveInt
});

export const registerEmployeeSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(6),
    fullName: z.string().trim().min(1),
    employeeCode: z.string().trim().min(1),
    jobRole: z.string().trim().min(1),
    defaultShiftHours: nonNegativeDecimalString,
    hourlyRate: nonNegativeDecimalString
});

export const updateEmployeeSchema = z.object({
    jobRole: z.string().trim().min(1).optional(),
    defaultShiftHours: nonNegativeDecimalString.optional(),
    hourlyRate: nonNegativeDecimalString.optional(),
    employmentStatus: z.enum(Object.values(EMPLOYMENT_STATUS)).optional()
}).refine( data => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update."
});

