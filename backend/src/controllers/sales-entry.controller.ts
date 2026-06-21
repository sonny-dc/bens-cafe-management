import type { Request, Response } from 'express';
import { salesEntryService } from '../services/index.js';

/**
 * GET /api/sales-entries
 */
export async function getAllSalesEntries(
    _req: Request, 
    res: Response
): Promise<void> {
    try {
        const salesEntries = await salesEntryService.getAllSalesEntries();
        if (salesEntries.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No sales entries found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Sales entries retrieved successfully.',
            data: salesEntries
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch sales entries'
        });
    }
}

/**
 * GET /api/sales-entries/:salesEntryId
 */
export async function getSalesEntryById(
    req: Request, 
    res: Response
): Promise<void> {
    try {
        const salesEntryId = Number(req.params.salesEntryId);
        const salesEntry = await salesEntryService.getSalesEntryById(salesEntryId);
        if (!salesEntry) {
            res.status(404).json({
                success: false,
                message: 'Sales entry not found.'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Sales entry retrieved successfully.',
            data: salesEntry
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch sales entry'
        });
    }
}

export async function createSalesEntry(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const newSalesEntry = await salesEntryService.createSalesEntryTransaction(req.body);
        if (!newSalesEntry) {
            res.status(400).json({
            success: false,
                message: 'Failed to create sales entry transaction. Please check the input data.'
            });
            return;
        }
        res.status(201).json({
            success: true,
            message: 'Sales entry transaction created successfully.',
            data: newSalesEntry
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process sales entry transaction'
        });
    }
}
