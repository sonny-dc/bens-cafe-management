import { AppError } from './app-errors.js';

export class InvalidCredentialsError extends AppError {
    constructor(message = 'Invalid username or password') {
        super(message, 401);
    }
}

export class AuthenticationRequiredError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403);
    }
}

export class SessionSaveError extends AppError {
    constructor(message = 'Failed to save login session') {
        super(message, 500);
    }
}

export class LogoutError extends AppError {
    constructor(message = 'An error occurred while logging out. Please try again') {
        super(message, 500);
    }
}
