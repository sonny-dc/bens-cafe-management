import type { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/index.js';

/**
 * GET /api/expenses
 */
export async function getAllExpenses(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const expenses = await expenseService.getAllExpenses();

        res.status(200).json({
            success: true,
            message: 'Expenses retrieved successfully.',
            data: expenses
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/expenses/:expenseId
 */
export async function getExpenseById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const expenseId = Number(req.params.expenseId);

        const expense = await expenseService.getExpenseById(expenseId);

        res.status(200).json({
            success: true,
            message: 'Expense retrieved successfully.',
            data: expense
        });
    } catch (error) {
        next(error);
    }
}
