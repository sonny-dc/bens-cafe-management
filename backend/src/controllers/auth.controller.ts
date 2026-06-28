import type { Request, Response } from 'express';
import { authService } from '../services/index.js';
import { SESSION_COOKIE_NAME } from '../config/constants.js';

export async function login(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user = await authService.loginUser(req.body);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
            return;
        }

        req.session.user = user;
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
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while logging in.';
        res.status(403).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function logout(
    req: Request,
    res: Response
): Promise<void> {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while logging out.'
            });
            return;
        }
        res.clearCookie(SESSION_COOKIE_NAME);

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
