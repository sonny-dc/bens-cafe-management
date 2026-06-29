import { Router } from 'express';

import { inventoryBudgetLogController } from '../controllers/index.js';

import {
    inventoryBudgetLogIdParamSchema
} from '../validators/index.js';

import { validate } from '../middleware/validation.middleware.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { REQUEST_TYPES } from '../config/constants.js';

const router = Router();

router.use(requireAdmin);

// GET /api/inventory-budget-logs
router.get(
    '/',
    inventoryBudgetLogController.getInventoryBudgetLogs
);

// GET /api/inventory-budget-logs/:budgetLogId
router.get(
    '/:budgetLogId',
    validate(inventoryBudgetLogIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryBudgetLogController.getInventoryBudgetLogById
);

export default router;
