import { z } from 'zod';
import { decimalString, nullablePositiveInt, nullableDecimalString } from './common.validator.js';
import { createExpenseSchema } from './expense.validator.js';
import { createPayrollEntrySchema } from './payroll-entry.validator.js';

export const salesEntryIdParamSchema = z.object({
    salesEntryId: z.coerce
    .number()
    .int()
    .positive("salesEntryId must be a positive integer")
});

export const createSalesEntrySchema = z.object({
    cashSales: decimalString,
    onlineCardSales: decimalString,
    physicalCashCount: nullableDecimalString,
    userId: nullablePositiveInt
});

export const createSalesEntryTransactionSchema = z.object({
    cashSales: decimalString,
    onlineCardSales: decimalString,
    physicalCashCount: nullableDecimalString,
    userId: nullablePositiveInt,

    payrollEntries: z.array(createPayrollEntrySchema).min(1, 'At least one payroll entry is required'),
    expenses: z.array(createExpenseSchema).optional().default([])
});

