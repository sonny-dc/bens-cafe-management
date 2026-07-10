import { AppError } from './app.errors.js';

export class UserNotFoundError extends AppError {
    constructor(message = 'User not found') {
        super(message, 404);
    }
}

export class UserAlreadyExistsError extends AppError {
    constructor(message = 'User already exists') {
        super(message, 409);
    }
}

export class InactiveUserError extends AppError {
    constructor(message = 'This account is inactive') {
        super(message, 403);
    }
}

export class UserCreationError extends AppError {
    constructor(message = 'Failed to create user') {
        super(message, 500, false);
    }
}

export class UserDeletionError extends AppError {
    constructor(message = 'Failed to delete user') {
        super(message, 500, false);
    }
}


