import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Creates a JSON response message for rate limiting.
 */
const createRateLimitHandler = (message: string) => {
    return (_req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: message,
            data: null,
        });
    }
}

/**
 * General rate limiter for all routes, allowing 250 requests per 15 minutes.
 */
const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 250, 
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many requests, please try again after 15 minutes.'),
});

/**
 * Rate limiter specifically for login attempts, allowing 5 attempts per 15 minutes.
 */
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed login attempts
    handler: createRateLimitHandler('Too many login attempts, please try again after 15 minutes.'),
});

/**
 * Rate limiter for inventory mutation operations, allowing 50 requests per minute.
 */
const inventoryMutationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many inventory update requests, please try again after a minute.'),
});

export { generalRateLimiter, loginRateLimiter, inventoryMutationLimiter };

