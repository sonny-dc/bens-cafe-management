import { staffMessageRepository } from '../repositories/index.js';
import type { StaffMessage, CreateStaffMessageInput } from '../models/index.js';

export async function createStaffMessage(input: CreateStaffMessageInput): Promise<StaffMessage> {
    if (!input.messageText.trim()) throw new Error('Message is required.');
    return staffMessageRepository.createStaffMessage(input);
}

export async function getAllStaffMessages(): Promise<StaffMessage[]> {
    return staffMessageRepository.getAllStaffMessages();
}

export async function getStaffMessagesByEmployee(employeeId: number): Promise<StaffMessage[]> {
    return staffMessageRepository.getStaffMessagesByEmployee(employeeId);
}

export async function markStaffMessageAsRead(messageId: number): Promise<boolean> {
    return staffMessageRepository.markStaffMessageAsRead(messageId);
}
