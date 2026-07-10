import { AppError } from './app.errors.js';

export class RestockCalculationNotFoundError extends AppError {
    constructor(message: string = 'Restock calculation not found') {
        super(message, 404);
    }
}

export class RestockCalculationCreationError extends AppError {
    constructor(message: string = 'Failed to create restock calculation') {
        super(message, 500, false);
    }
}

export class RestockCalculationExecutionError extends AppError {
    constructor(message: string = 'Failed to execute restock calculation') {
        super(message, 500, false);
    }
}
