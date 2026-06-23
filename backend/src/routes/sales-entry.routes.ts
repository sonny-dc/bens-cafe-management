import { Router } from 'express';

import { validate } from '../middleware/validation.middleware.js';
import { salesEntryIdParamSchema, createSalesEntryTransactionSchema } from '../validators/index.js';
import { salesEntryController } from '../controllers/index.js';
import { REQUEST_TYPES } from '../config/constants.js';

const router = Router();

router.get('/', salesEntryController.getAllSalesEntries);
router.get(
    '/:salesEntryId',
    validate(salesEntryIdParamSchema, REQUEST_TYPES.PARAMS),
    salesEntryController.getSalesEntryById
);
router.post(
    '/',
    validate(createSalesEntryTransactionSchema, REQUEST_TYPES.BODY),
    salesEntryController.createSalesEntry
);

export default router;