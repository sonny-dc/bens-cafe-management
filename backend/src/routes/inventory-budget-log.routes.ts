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

router.get(
    '/',
    inventoryBudgetLogController.getInventoryBudgetLogs
);

router.get(
    '/:budgetLogId/summary',
    validate(inventoryBudgetLogIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryBudgetLogController.getInventoryBudgetLogSummaryById
);

router.get(
    '/:budgetLogId',
    validate(inventoryBudgetLogIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryBudgetLogController.getInventoryBudgetLogById
);

export default router;
