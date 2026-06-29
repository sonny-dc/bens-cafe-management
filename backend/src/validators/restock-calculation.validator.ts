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

export const restockCalculationIdParamSchema = z.object({
  calculationId: positiveInt
});

export const createRestockCalculationSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: positiveInt,
        quantityToBuy: positiveDecimalString
      })
    )
    .min(1, 'At least one item must be added to the restock calculation')
});

export type CreateRestockCalculationInput = z.infer<typeof createRestockCalculationSchema>;
export type RestockCalculationIdParam = z.infer<typeof restockCalculationIdParamSchema>;
