import type { Request, Response, NextFunction } from 'express';
import { salesEntryService } from '../services/index.js';

/**
 * GET /api/sales-entries
 */
export async function getAllSalesEntries(
    _req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const salesEntries = await salesEntryService.getAllSalesEntries();
        
        res.status(200).json({
            success: true,
            message: 'Sales entries retrieved successfully.',
            data: salesEntries
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/sales-entries/:salesEntryId
 */
export async function getSalesEntryById(
    req: Request, 
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const salesEntryId = Number(req.params.salesEntryId);
        const salesEntry = await salesEntryService.getSalesEntryById(salesEntryId);

        res.status(200).json({
            success: true,
            message: 'Sales entry retrieved successfully.',
            data: salesEntry
        });
    } catch (error) {
        next(error);
    }
}

export async function createSalesEntry(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.session.user!.userId;
        const newSalesEntry = await salesEntryService.createSalesEntryTransaction(req.body, userId);

        res.status(201).json({
            success: true,
            message: 'Sales entry transaction created successfully.',
            data: newSalesEntry
        });
    } catch (error) {
        next(error);
    }
}
