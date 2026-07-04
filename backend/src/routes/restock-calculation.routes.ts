import { Router } from 'express';

import { restockCalculationController } from '../controllers/index.js';

import {
    createRestockCalculationSchema,
    restockCalculationIdParamSchema
} from '../validators/index.js';

import { validate } from '../middleware/validation.middleware.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { inventoryMutationLimiter } from '../middleware/rate-limiter.middleware.js';

import { REQUEST_TYPES } from '../config/constants.js';

const router = Router();

router.use(requireAdmin);

// GET /api/restock-calculations
router.get(
    '/',
    restockCalculationController.getAllRestockCalculations
);

// GET /api/restock-calculations/:calculationId
router.get(
    '/:calculationId',
    validate(restockCalculationIdParamSchema, REQUEST_TYPES.PARAMS),
    restockCalculationController.getRestockCalculationById
);

// POST /api/restock-calculations
router.post(
    '/',
    inventoryMutationLimiter,
    validate(createRestockCalculationSchema, REQUEST_TYPES.BODY),
    restockCalculationController.executeRestockCalculation
);

export default router;
