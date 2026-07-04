import { Router } from 'express';
import { inventoryRequestController } from '../controllers/index.js';
import { REQUEST_TYPES } from '../config/constants.js';
import {
    createInventoryRequestSchema,
    updateInventoryRequestStatusSchema,
    inventoryRequestIdParamSchema
} from '../validators/index.js';

import { validate } from '../middleware/validation.middleware.js';
import { requireAdmin, requireEmployee } from '../middleware/auth.middleware.js';
import { inventoryMutationLimiter } from '../middleware/rate-limiter.middleware.js';

const router = Router();

// ==========================
// GET ROUTES
// ==========================

// Admin gets all inventory requests
router.get('/', 
    requireAdmin,
    inventoryRequestController.getAllInventoryRequests
);

// Admin gets all inventory requests simplified
router.get('/simplified', 
    requireAdmin,
    inventoryRequestController.getAllInventoryRequestsSimplified
);

// Admin gets an inventory request by ID simplified
router.get(
    '/simplified/:requestId',
    requireAdmin,
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryRequestController.getInventoryRequestByIdSimplified
);

router.get(
    '/my',
    requireEmployee,
    inventoryRequestController.getMyInventoryRequests
);

// Admin gets an inventory request by ID
router.get(
    '/:requestId',
    requireAdmin,
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryRequestController.getInventoryRequestById
);

// ==========================
// POST ROUTES
// ==========================

// Employee creates a new inventory request
router.post(
    '/',
    requireEmployee,
    inventoryMutationLimiter,
    validate(createInventoryRequestSchema, REQUEST_TYPES.BODY),
    inventoryRequestController.createInventoryRequest
);

// ==========================
// PUT/PATCH ROUTES
// ==========================

// Admin updates the status of an inventory request
router.patch(
    '/:requestId/status',
    requireAdmin,
    inventoryMutationLimiter,
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(updateInventoryRequestStatusSchema, REQUEST_TYPES.BODY),
    inventoryRequestController.updateInventoryRequestStatus
);

export default router;
