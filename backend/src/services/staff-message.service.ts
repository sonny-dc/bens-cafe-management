import { staffMessageRepository } from '../repositories/index.js';
import type { StaffMessage, CreateStaffMessageInput, UpdateStaffMessageStatusInput } from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

export async function createStaffMessage(input: Omit<CreateStaffMessageInput, 'postedAt'>): Promise<StaffMessage> {
    return staffMessageRepository.createStaffMessage({...input, postedAt: getCurrentAppDateTime()});
}

export async function getAllStaffMessages(): Promise<StaffMessage[]> {
    return staffMessageRepository.getAllStaffMessages();
}

export async function getStaffMessagesByEmployee(employeeId: number): Promise<StaffMessage[]> {
    return staffMessageRepository.getStaffMessagesByEmployee(employeeId);
}

export async function updateStaffMessageStatus(input: Omit<UpdateStaffMessageStatusInput, 'readAt'>): Promise<boolean> {
    return staffMessageRepository.updateStaffMessageStatus({ ...input, readAt: getCurrentAppDateTime() });
}
