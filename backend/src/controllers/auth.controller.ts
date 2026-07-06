import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/index.js';
import { SESSION_COOKIE_NAME } from '../config/constants.js';
import {
    // Auth Errors
    SessionSaveError,
    LogoutError
} from '../errors/index.js';

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await authService.loginUser(req.body);
        req.session.user = user;

        req.session.save((err) => {
            if (err) {
                next(new SessionSaveError('Failed to login. Please try again.'));
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: {
                    user: {
                        userId: user.userId,
                        username: user.username,
                        fullName: user.fullName,
                        role: user.role,
                        employeeId: user.employeeId
                    }
                }
            });
        });
    } catch (error) {
        next(error);
    }
}


export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    req.session.destroy((err) => {
        if (err) {
            next(new LogoutError());
            return;
        }

        res.clearCookie(SESSION_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful.'
        });
    });
}

export async function me(
    req: Request,
    res: Response
): Promise<void> {
    const user = req.session.user;

    res.status(200).json({
        success: true,
        message: 'Current user retrieved successfully.',
        data: {
            ...user
        }
    });

}
