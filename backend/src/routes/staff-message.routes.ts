import { Router } from 'express';
import { staffMessageController } from '../controllers/index.js';
import { 
    createStaffMessageSchema, 
    staffMessageIdParamSchema, 
    employeeIdParamSchema,
    updateStaffMessageStatusSchema
} from '../validators/index.js';
import { REQUEST_TYPES } from '../config/constants.js';
import { validate } from '../middleware/validation.middleware.js';

const router = Router();

// POST
router.post('/',
    validate(createStaffMessageSchema, REQUEST_TYPES.BODY),
    staffMessageController.createStaffMessage);

// GET
router.get('/', staffMessageController.getAllStaffMessages);

router.get(
    '/employee/:employeeId', 
    validate(employeeIdParamSchema, REQUEST_TYPES.PARAMS), 
    staffMessageController.getStaffMessagesByEmployee);

// PATCH

router.patch(
    '/:messageId/status', 
    validate(staffMessageIdParamSchema, REQUEST_TYPES.PARAMS), 
    validate(updateStaffMessageStatusSchema, REQUEST_TYPES.BODY),
    staffMessageController.updateStaffMessageStatus);

export default router;
