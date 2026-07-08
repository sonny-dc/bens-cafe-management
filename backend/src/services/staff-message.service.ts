import { staffMessageRepository, employeeRepository } from '../repositories/index.js';
import type {
    StaffMessage,
    CreateStaffMessageInputForUser,
    UpdateStaffMessageStatusInput
} from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

import {
    // General Error
    AppError,
    // Employee Errors
    EmployeeNotFoundError,

    // Staff Message Errors
    StaffMessageNotFoundError,
    StaffMessageCreationError,
    StaffMessageUpdateError
} from '../errors/index.js';



export async function createStaffMessageForUser(
    userId: number,
    input: CreateStaffMessageInputForUser
): Promise<StaffMessage> {
    const employee = await employeeRepository.getEmployeeByUserId(userId);

    if (employee === null) {
        throw new EmployeeNotFoundError();
    }

    const staffMessage = await staffMessageRepository.createStaffMessage({
        employeeId: employee.employeeId,
        messageType: input.messageType,
        subject: input.subject,
        messageText: input.messageText,
        postedAt: getCurrentAppDateTime()
    });

    if (!staffMessage) {
        throw new StaffMessageCreationError();
    }

    return staffMessage;
}

export async function getMyStaffMessages(userId: number): Promise<StaffMessage[]> {
    const employee = await employeeRepository.getEmployeeByUserId(userId);

    if (employee === null) {
        throw new EmployeeNotFoundError();
    }

    return staffMessageRepository.getStaffMessagesByEmployee(employee.employeeId);
}

export async function getAllStaffMessages(): Promise<StaffMessage[]> {
    return staffMessageRepository.getAllStaffMessages();
}

export async function getStaffMessagesByEmployee(employeeId: number): Promise<StaffMessage[]> {
    return staffMessageRepository.getStaffMessagesByEmployee(employeeId);
}

export async function updateStaffMessageStatus(
    input: Omit<UpdateStaffMessageStatusInput, 'readAt'>
): Promise<boolean> {
    try {
        const result = await staffMessageRepository.updateStaffMessageStatus({
        ...input,
        readAt: getCurrentAppDateTime()
        });
        if (!result) {
            throw new StaffMessageNotFoundError();
        }
        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new StaffMessageUpdateError();
    }
}
