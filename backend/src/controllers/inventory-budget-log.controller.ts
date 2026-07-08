import type { Request, Response, NextFunction } from 'express';
import { inventoryBudgetLogService } from '../services/index.js';

export async function getInventoryBudgetLogs(
    _req: Request,
    res: Response,
    next: NextFunction
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
        next(error);
    }
}

export async function getInventoryBudgetLogById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const budgetLogId = Number(req.params.budgetLogId);

        const budgetLog = await inventoryBudgetLogService.getInventoryBudgetLogById(budgetLogId);

        res.status(200).json({
            success: true,
            message: 'Inventory budget log fetched successfully.',
            data: budgetLog
        });
    } catch (error) {
        next(error);
    }
}
