// validators/expense.validator.ts
import { z } from 'zod';
import { decimalString, nullablePositiveInt, positiveInt } from './common.validator.js';

import { EXPENSE_CATEGORIES } from '../config/constants.js';

export const expenseCategorySchema = z.enum(Object.values(EXPENSE_CATEGORIES));

export const expenseIdParamSchema = z.object({
    expenseId: positiveInt
});

export const createExpenseSchema = z.object({
    description: z
        .string()
        .trim()
        .max(255, 'description must not exceed 255 characters')
        .nullable()
        .optional()
        .transform((value) => value ?? null),

    amount: decimalString,

    userId: nullablePositiveInt,

    expenseCategory: expenseCategorySchema
});