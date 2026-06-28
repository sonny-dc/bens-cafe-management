import type { Request, Response, NextFunction } from 'express';
import { type ZodType, z } from 'zod';
import { type RequestType, REQUEST_TYPES } from '../config/constants.js';

export function validate(schema: ZodType, requestType: RequestType = REQUEST_TYPES.BODY) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[requestType]);
        if (!result.success) {
            res.status(400).json({
                success: false, 
                message: "Input validation failed. Please check the provided data and try again.", 
                errors: z.flattenError(result.error)
            });
            return;
        }
        // temporary fix for query validation. might update this later to handle query validation better
        if (requestType === REQUEST_TYPES.QUERY) {
            next();
            return;
        }
        
        req[requestType] = result.data;
        next();
    };
}
