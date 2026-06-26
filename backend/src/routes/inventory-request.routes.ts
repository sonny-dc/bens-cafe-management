import { Router } from 'express';
import { inventoryRequestController } from '../controllers/index.js';
import { REQUEST_TYPES } from '../config/constants.js';
import {
    createInventoryRequestSchema,
    updateInventoryRequestStatusSchema,
    inventoryRequestIdParamSchema
} from '../validators/index.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

// ==========================
// GET ROUTES
// ==========================
router.get('/', inventoryRequestController.getAllInventoryRequests);
router.get('/simplified', inventoryRequestController.getAllInventoryRequestsSimplified);

router.get(
    '/:requestId',
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryRequestController.getInventoryRequestById
)
router.get(
    '/simplified/:requestId',
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    inventoryRequestController.getInventoryRequestByIdSimplified
)

// ==========================
// POST ROUTES
// ==========================
router.post(
    '/',
    validate(createInventoryRequestSchema, REQUEST_TYPES.BODY),
    inventoryRequestController.createInventoryRequest
)

// ==========================
// PUT/PATCH ROUTES
// ==========================
router.patch(
    '/:requestId/status',
    validate(inventoryRequestIdParamSchema, REQUEST_TYPES.PARAMS),
    validate(updateInventoryRequestStatusSchema, REQUEST_TYPES.BODY),
    inventoryRequestController.updateInventoryRequestStatus
)

export default router;
