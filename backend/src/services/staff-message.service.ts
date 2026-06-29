import { staffMessageRepository, employeeRepository } from '../repositories/index.js';
import type {
    StaffMessage,
    CreateStaffMessageInputForUser,
    UpdateStaffMessageStatusInput
} from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';



export async function createStaffMessageForUser(
    userId: number,
    input: CreateStaffMessageInputForUser
): Promise<StaffMessage> {
    const employee = await employeeRepository.getEmployeeByUserId(userId);

    if (employee === null) {
        throw new Error('Employee profile was not found for the current user.');
    }

    return staffMessageRepository.createStaffMessage({
        employeeId: employee.employeeId,
        messageType: input.messageType,
        subject: input.subject,
        messageText: input.messageText,
        postedAt: getCurrentAppDateTime()
    });
}

export async function getMyStaffMessages(userId: number): Promise<StaffMessage[]> {
    const employee = await employeeRepository.getEmployeeByUserId(userId);

    if (employee === null) {
        return [];
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
    return staffMessageRepository.updateStaffMessageStatus({
        ...input,
        readAt: getCurrentAppDateTime()
    });
}
