import type { Request, Response, NextFunction } from 'express';
import { USER_ROLES } from '../config/constants.js';

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
        return;
    }
    next();
}

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
        return;
    }

    if (req.session.user.role !== USER_ROLES.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Admin access required.'
        });
        return;
    }

    next();
}

export function requireEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.session || !req.session.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
        return;
    }

    if (req.session.user.role !== USER_ROLES.EMPLOYEE) {
        res.status(403).json({
            success: false,
            message: 'Employee access required.'
        });
        return;
    }
    next();
}
