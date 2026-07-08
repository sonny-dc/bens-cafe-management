import type { Expense } from '../models/index.js';
import { expenseRepository } from '../repositories/index.js';

import {
    ExpenseNotFoundError
} from '../errors/index.js';

export async function getAllExpenses(): Promise<Expense[]> {
    return await expenseRepository.getAllExpenses();
}

export async function getExpenseById(
    expenseId: number
): Promise<Expense> {
    const expense = await expenseRepository.getExpenseById(expenseId);
    if (!expense) {
        throw new ExpenseNotFoundError();
    }
    return expense;
}
