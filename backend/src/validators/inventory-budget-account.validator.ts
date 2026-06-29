import { z } from 'zod';
import { nonNegativeDecimalString, positiveInt } from './common.validator.js';

export const inventoryBudgetAccountIdParamSchema = z.object({
  budgetAccountId: positiveInt
});

export const updateInventoryBudgetAccountSchema = z.object({
  currentBalance: nonNegativeDecimalString
});
