import type { Request, Response } from 'express';
import { expenseService } from '../services/index.js';

/**
 * GET /api/expenses
 */
export async function getAllExpenses(
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const expenses = await expenseService.getAllExpenses();

        res.status(200).json({
            success: true,
            message: 'Expenses retrieved successfully.',
            data: expenses
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to fetch expenses';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}

/**
 * GET /api/expenses/:expenseId
 */
export async function getExpenseById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const expenseId = Number(req.params.expenseId);

        const expense = await expenseService.getExpenseById(expenseId);

        if (!expense) {
            res.status(404).json({
                success: false,
                message: 'Expense not found.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Expense retrieved successfully.',
            data: expense
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to fetch expense';

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
}
