import { Router } from 'express';

import { validate } from '../middleware/validation.middleware.js';
import { authController } from '../controllers/index.js';
import { loginSchema } from '../validators/index.js';
import { REQUEST_TYPES } from '../config/constants.js';

const router = Router();

router.post(
    '/login',
    validate(loginSchema, REQUEST_TYPES.BODY),
    authController.login
);

router.post(
    '/logout',
    authController.logout
);

router.get(
    '/me',
    authController.me
);

export default router;
