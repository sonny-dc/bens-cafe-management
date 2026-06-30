import { Router } from 'express';

import { validate } from '../middleware/validation.middleware.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { expenseController } from '../controllers/index.js';
import { expenseIdParamSchema } from '../validators/index.js';
import { REQUEST_TYPES } from '../config/constants.js';

const router = Router();

router.use(requireAdmin);

router.get('/', expenseController.getAllExpenses);

router.get(
    '/:expenseId',
    validate(expenseIdParamSchema, REQUEST_TYPES.PARAMS),
    expenseController.getExpenseById
);

export default router;
