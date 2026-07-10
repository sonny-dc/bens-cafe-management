import { AppError } from './app.errors.js';

export class PayrollEntryNotFoundError extends AppError {
    constructor(message = 'Payroll entry not found.') {
        super(message, 404);
    }
}

export class PayrollEntryCreationError extends AppError {
    constructor(message = 'Failed to create payroll entry.') {
        super(message, 500, false);
    }
}
