import { staffMessageRepository } from '../repositories/index.js';
import type { StaffMessage, CreateStaffMessageInput } from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

export async function createStaffMessage(input: Omit<CreateStaffMessageInput, 'postedAt'>): Promise<StaffMessage> {
    if (!input.messageText.trim()) throw new Error('Message is required.');
    return staffMessageRepository.createStaffMessage({...input, postedAt: getCurrentAppDateTime()});
}

export async function getAllStaffMessages(): Promise<StaffMessage[]> {
    return staffMessageRepository.getAllStaffMessages();
}

export async function getStaffMessagesByEmployee(employeeId: number): Promise<StaffMessage[]> {
    return staffMessageRepository.getStaffMessagesByEmployee(employeeId);
}

export async function markStaffMessageAsRead(messageId: number): Promise<boolean> {
    return staffMessageRepository.markStaffMessageAsRead(messageId, getCurrentAppDateTime());
}
