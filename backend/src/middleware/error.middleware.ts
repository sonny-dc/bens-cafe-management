import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';

export function globalErrorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.isOperational ? err.message : 'Internal Server Error',
        });
        return;
    }
    console.error('UNEXPECTED ERROR DETECTED');
    console.error(err.stack || err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
}
