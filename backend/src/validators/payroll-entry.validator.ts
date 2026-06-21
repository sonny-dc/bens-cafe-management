// validators/payroll-entry.validator.ts
import { z } from 'zod';
import { decimalString, positiveInt } from './common.validator.js';

export const payrollEntryIdParamSchema = z.object({
    payrollEntryId: positiveInt
});

export const createPayrollEntrySchema = z.object({
    employeeId: positiveInt,
    grossPay: decimalString
});