import { Router } from 'express';

import { inventoryBudgetAccountController } from '../controllers/index.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAdmin);

// GET /api/inventory-budget-account
router.get(
    '/',
    inventoryBudgetAccountController.getInventoryBudgetAccount
);

export default router;
