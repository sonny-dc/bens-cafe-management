import { Router } from 'express';
import { inventoryRequestController } from '../controllers/index.js';

const router = Router();

router.get('/', inventoryRequestController.getAllInventoryRequests);
router.patch('/:id/status', inventoryRequestController.updateInventoryRequestStatus);

export default router;
