import type { Request, Response } from 'express';
import { inventoryBudgetLogService } from '../services/index.js';

export async function getInventoryBudgetLogs(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const budgetLogs =
            await inventoryBudgetLogService.getInventoryBudgetLogs();

        res.status(200).json({
            success: true,
            message: 'Inventory budget logs fetched successfully.',
            data: budgetLogs
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching inventory budget logs.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

export async function getInventoryBudgetLogById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const budgetLogId = Number(req.params.budgetLogId);

        const budgetLog =
            await inventoryBudgetLogService.getInventoryBudgetLogById(budgetLogId);

        if (!budgetLog) {
            res.status(404).json({
                success: false,
                message: 'Inventory budget log not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory budget log fetched successfully.',
            data: budgetLog
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching the inventory budget log.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
