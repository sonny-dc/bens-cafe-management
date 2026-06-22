import { shiftRepository } from '../repositories/index.js';
import type { Shift, StartShiftInput, EndShiftInput } from 'shared/models';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

export async function startShift(input: Omit<StartShiftInput, 'startTime'>): Promise<Shift> {
    // Check if the employee already has an active shift
    const activeShift = await shiftRepository.getActiveShiftByEmployee(input.employeeId);
    if (activeShift) {
        throw new Error("Employee already has an active shift.");
    }

    // Create new shift
    return shiftRepository.startShift({
        ...input,
        startTime: getCurrentAppDateTime()
    });
}

export async function endShift(shiftId: number, input: Omit<EndShiftInput, 'endTime'>): Promise<Shift> {
    // Get the shift
    const shift = await shiftRepository.getShiftById(shiftId);

    if (!shift) {
        throw new Error("Shift not found.");
    }

    if (shift.status === 'completed') {
        throw new Error("Shift is already completed.");
    }

    // Note: cash_variance is calculated by the database dynamically
    // so we just pass the closingCash and end the shift.
    const endedShift = await shiftRepository.endShift(
        shiftId, 
        { 
            ...input,
             endTime: getCurrentAppDateTime() 
        }
    );

    if (!endedShift) {
        throw new Error("Failed to end shift.");
    }

    return endedShift;
}

export async function getActiveShift(employeeId: number): Promise<Shift | null> {
    return shiftRepository.getActiveShiftByEmployee(employeeId);
}

export async function getAllActiveShifts(): Promise<any[]> {
    return shiftRepository.getAllActiveShifts();
}

export async function getShiftSummary(startDate: string, endDate: string): Promise<Shift[]> {
    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required.");
    }
    return shiftRepository.getShiftSummary(startDate, endDate);
}

export async function archiveShifts(startDate: string, endDate: string): Promise<number> {
    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required.");
    }
    return shiftRepository.archiveShiftsByDateRange(startDate, endDate);
}
