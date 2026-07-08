import type { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../config/constants.js';

import {
    // Auth Errors
    AuthenticationRequiredError,
    ForbiddenError,
} from '../errors/index.js';

export function requireAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        next(new AuthenticationRequiredError());
        return;
    }
    next();
}

export function requireAdmin(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        next(new AuthenticationRequiredError());
        return;
    }

    if (!req.session.user.userId) {
        next(new AuthenticationRequiredError('Please sign in again'));
        return;
    }

    if (req.session.user.role !== USER_ROLES.ADMIN) {
        next(new ForbiddenError('Admin access required'));
        return;
    }

    next();
}

export function requireEmployee(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        next(new AuthenticationRequiredError());
        return;
    }
    if (req.session.user.role !== USER_ROLES.EMPLOYEE) {
        next(new ForbiddenError('Employee access required'));
        return;
    }
    if (!req.session.user.employeeId) {
        next(new ForbiddenError('Employee profile required'));
        return;
    }
    
    next();
}
