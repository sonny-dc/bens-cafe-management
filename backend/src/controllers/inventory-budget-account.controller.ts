import type { Request, Response } from 'express';
import { inventoryBudgetAccountService } from '../services/index.js';

export async function getInventoryBudgetAccount(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const budgetAccount =
            await inventoryBudgetAccountService.getInventoryBudgetAccount();

        if (!budgetAccount) {
            res.status(404).json({
                success: false,
                message: 'Inventory budget account not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Inventory budget account fetched successfully.',
            data: budgetAccount
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An error occurred while fetching inventory budget account.';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
