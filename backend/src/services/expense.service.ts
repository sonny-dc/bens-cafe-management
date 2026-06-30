import type { Expense } from '../models/index.js';
import { expenseRepository } from '../repositories/index.js';

export async function getAllExpenses(): Promise<Expense[]> {
    return await expenseRepository.getAllExpenses();
}

export async function getExpenseById(
    expenseId: number
): Promise<Expense | null> {
    return await expenseRepository.getExpenseById(expenseId);
}
