import { AppError } from './app-errors.js';

export class ExpenseNotFoundError extends AppError {
    constructor(message = 'Expense not found.') {
        super(message, 404);
    }
}

export class ExpenseCreationError extends AppError {
    constructor(message = 'Failed to create expense.') {
        super(message, 500, false);
    }
}
