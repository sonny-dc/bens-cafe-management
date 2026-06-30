import { z } from 'zod';
import { decimalString, positiveInt, nullablePositiveInt, nullableDecimalString } from './common.validator.js';
import { createExpenseSchema } from './expense.validator.js';
import { createPayrollEntrySchema } from './payroll-entry.validator.js';

export const salesEntryIdParamSchema = z.object({
    salesEntryId: positiveInt
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

    payrollEntries: z.array(createPayrollEntrySchema).min(1, 'At least one payroll entry is required'),
    expenses: z.array(createExpenseSchema).optional().default([])
});

