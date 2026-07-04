import { Router } from 'express';
import { inventoryItemController } from '../controllers/index.js';

import {
    inventoryItemIdParamSchema,
    createInventoryItemSchema,
    updateInventoryItemSchema
} from '../validators/index.js';

import { REQUEST_TYPES } from '../config/constants.js';
import { validate } from '../middleware/validation.middleware.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { inventoryMutationLimiter } from '../middleware/rate-limiter.middleware.js';

const router = Router();

// POST /api/inventory-items
router.post(
    '/',
    requireAdmin,
    inventoryMutationLimiter,
    validate(createInventoryItemSchema, REQUEST_TYPES.BODY),
    inventoryItemController.createInventoryItem
);

// GET /api/inventory-items
router.get(
    '/',
    requireAuth,
    inventoryItemController.getAllInventoryItems
);

// GET /api/inventory-items/list
router.get(
    '/list',
    requireAuth,
    inventoryItemController.getInventoryItemList
);

// GET /api/inventory-items/options
router.get(
    '/options',
    requireAuth,
    inventoryItemController.getInventoryItemOptions
);

// GET /api/inventory-items/:itemId
router.get(
    '/:itemId',
    requireAuth,
    validate(inventoryItemIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryItemController.getInventoryItemById
);

// PATCH /api/inventory-items/:itemId
router.patch(
    '/:itemId',
    requireAdmin,
    inventoryMutationLimiter,
    validate(inventoryItemIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(updateInventoryItemSchema, REQUEST_TYPES.BODY),
    inventoryItemController.updateInventoryItem
);

// DELETE /api/inventory-items/:itemId
router.delete(
    '/:itemId',
    requireAdmin,
    inventoryMutationLimiter,
    validate(inventoryItemIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryItemController.deleteInventoryItem
);

export default router;
