import { z } from 'zod';
import { positiveInt } from './common.validator.js';

const positiveDecimalString = z
  .string()
  .trim()
  .min(1, 'Quantity must not be empty')
  .refine(value => !Number.isNaN(Number(value)), {
    message: 'Quantity must be a valid number'
  })
  .refine(value => Number(value) > 0, {
    message: 'Quantity must be greater than 0'
  });

export const restockCalculationItemIdParamSchema = z.object({
  calculationItemId: positiveInt
});

export const createRestockCalculationItemSchema = z.object({
  calculationId: positiveInt,
  itemId: positiveInt,
  quantityToBuy: positiveDecimalString,
  unitCostSnapshot: positiveDecimalString
});
