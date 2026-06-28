import { Router } from 'express';

import { validate } from '../middleware/validation.middleware.js';
import { authController } from '../controllers/index.js';
import { loginSchema } from '../validators/index.js';
import { REQUEST_TYPES } from '../config/constants.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/login',
    validate(loginSchema, REQUEST_TYPES.BODY),
    authController.login
);

router.post(
    '/logout',
    requireAuth,
    authController.logout
);

router.get(
    '/me',
    requireAuth,
    authController.me
);

export default router;
