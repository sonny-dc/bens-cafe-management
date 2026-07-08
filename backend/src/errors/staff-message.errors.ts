import { AppError } from './app-errors.js';

export class StaffMessageNotFoundError extends AppError {
    constructor(message = 'Staff message not found.') {
        super(message, 404);
    }
}

export class StaffMessageCreationError extends AppError {
    constructor(message = 'Failed to create staff message.') {
        super(message, 500, false);
    }
}

export class StaffMessageUpdateError extends AppError {
    constructor(message = 'Failed to update staff message status.') {
        super(message, 500, false);
    }
}
