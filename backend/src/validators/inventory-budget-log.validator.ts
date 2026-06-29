import { z } from 'zod';

import {
  INVENTORY_BUDGET_TRANSACTION_TYPES,
  INVENTORY_BUDGET_SOURCE_TYPES
} from '../config/constants.js';

import {
  positiveInt,
  nonNegativeDecimalString
} from './common.validator.js';

const positiveDecimalString = z
  .string()
  .trim()
  .min(1, 'Amount must not be empty')
  .refine(value => !Number.isNaN(Number(value)), {
    message: 'Amount must be a valid number'
  })
  .refine(value => Number(value) > 0, {
    message: 'Amount must be greater than 0'
  });

export const inventoryBudgetLogIdParamSchema = z.object({
  budgetLogId: positiveInt
});

export const createInventoryBudgetLogSchema = z
  .object({
    transactionType: z.enum(Object.values(INVENTORY_BUDGET_TRANSACTION_TYPES)),
    amount: positiveDecimalString,
    sourceType: z.enum(Object.values(INVENTORY_BUDGET_SOURCE_TYPES)),
    salesEntryId: positiveInt.nullable().optional(),
    restockCalculationId: positiveInt.nullable().optional(),
    balanceBefore: nonNegativeDecimalString,
    balanceAfter: nonNegativeDecimalString,
    userId: positiveInt.nullable().optional(),
    postedAt: z.string().optional()
  })
  .refine(
    data =>
      data.transactionType === INVENTORY_BUDGET_TRANSACTION_TYPES.IN &&
      data.sourceType === INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY &&
      data.salesEntryId !== null &&
      data.salesEntryId !== undefined &&
      (data.restockCalculationId === null || data.restockCalculationId === undefined),
    {
      message: 'IN budget logs must reference a sales entry only.',
      path: ['salesEntryId']
    }
  )
  .or(
    z.object({
        transactionType: z.literal(INVENTORY_BUDGET_TRANSACTION_TYPES.OUT),
        amount: positiveDecimalString,
        sourceType: z.literal(INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION),
        salesEntryId: z.null().optional(),
        restockCalculationId: positiveInt,
        balanceBefore: nonNegativeDecimalString,
        balanceAfter: nonNegativeDecimalString,
        userId: positiveInt.nullable().optional(),
        postedAt: z.string().optional()
      })
  );
