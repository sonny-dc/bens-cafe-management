import type { Request, Response, NextFunction } from 'express';
import { inventoryBudgetAccountService } from '../services/index.js';

export async function getInventoryBudgetAccount(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const budgetAccount = await inventoryBudgetAccountService.getInventoryBudgetAccount();

        res.status(200).json({
            success: true,
            message: 'Inventory budget account fetched successfully.',
            data: budgetAccount
        });
    } catch (error) {
        next(error);
    }
}
