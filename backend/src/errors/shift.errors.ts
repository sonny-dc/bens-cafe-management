import { AppError } from './app.errors.js';

export class ShiftNotFoundError extends AppError {
    constructor(message = 'Shift not found') {
        super(message, 404);
    }
}

export class ShiftAlreadyInProgressError extends AppError {
    constructor(message = 'Shift is already in progress') {
        super(message, 409);
    }
}

export class ShiftAlreadyCompletedError extends AppError {
    constructor(message = 'Shift is already completed') {
        super(message, 409);
    }
}

export class ShiftArchiveError extends AppError {
    constructor(message = 'No shifts were archived') {
        super(message, 409);
    }
}

export class ShiftAccessDeniedError extends AppError {
    constructor(message = 'You are not allowed to access this shift') {
        super(message, 403);
    }
}

export class ShiftUpdateError extends AppError {
    constructor(message = 'Failed to update shift') {
        super(message, 500, false);
    }
}
