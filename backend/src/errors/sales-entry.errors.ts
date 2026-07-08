import { AppError } from './app-errors.js';

export class SalesEntryNotFoundError extends AppError {
    constructor(message = 'Sales entry not found.') {
        super(message, 404);
    }
}

export class SalesEntryCreationError extends AppError {
    constructor(message = 'Failed to create sales entry.') {
        super(message, 500, false);
    }
}

export class SalesEntryUpdateError extends AppError {
    constructor(message = 'Failed to update sales entry.') {
        super(message, 500, false);
    }
}

export class SalesEntryExecutionError extends AppError {
    constructor(message = 'Failed to execute sales entry.') {
        super(message, 500, false);
    }
}
