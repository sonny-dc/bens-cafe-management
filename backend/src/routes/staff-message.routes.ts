import { Router } from 'express';
import { staffMessageController } from '../controllers/index.js';

const router = Router();

router.post('/', staffMessageController.createStaffMessage);
router.get('/', staffMessageController.getAllStaffMessages);
router.get('/employee/:employeeId', staffMessageController.getStaffMessagesByEmployee);
router.patch('/:staffMessageId/read', staffMessageController.markStaffMessageAsRead);

export default router;
