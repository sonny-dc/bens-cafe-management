import { z } from 'zod';
import { positiveInt, nonNegativeDecimalString } from './common.validator.js';
import { INVENTORY_ITEM_CATEGORIES } from '../config/constants.js';

export const inventoryItemIdParamSchema = z.object({
  itemId: positiveInt
});

export const createInventoryItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name must not be empty'),
  category: z.enum(Object.values(INVENTORY_ITEM_CATEGORIES)),
  unit: z.string().trim().min(1, 'Unit must not be empty'),
  stockQuantity: nonNegativeDecimalString,
  lowThreshold: nonNegativeDecimalString,
  unitCost: nonNegativeDecimalString
});

export const updateInventoryItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name must not be empty').optional(),
  category: z.enum(Object.values(INVENTORY_ITEM_CATEGORIES)).optional(),
  unit: z.string().trim().min(1, 'Unit must not be empty').optional(),
  stockQuantity: nonNegativeDecimalString.optional(),
  lowThreshold: nonNegativeDecimalString.optional(),
  unitCost: nonNegativeDecimalString.optional()
}).refine(
  data => Object.values(data).some(value => value !== undefined),
  {
    message: 'At least one field must be provided for update.'
  }
);
