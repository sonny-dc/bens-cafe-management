import { inventoryRequestRepository } from '../repositories/index.js';

export async function getAllInventoryRequests(): Promise<any[]> {
    return inventoryRequestRepository.getAllInventoryRequests();
}

export async function getInventoryRequestsByEmployee(employeeId: number): Promise<any[]> {
    return inventoryRequestRepository.getInventoryRequestsByEmployee(employeeId);
}

export async function createInventoryRequest(employeeId: number, itemId: number, requestedQuantity: number, requestedUnit: string, reason: string, requestStatus: string): Promise<number> {
    return inventoryRequestRepository.createInventoryRequest(employeeId, itemId, requestedQuantity, requestedUnit, reason, requestStatus);
}

export async function updateInventoryRequestStatus(requestId: number, status: string): Promise<boolean> {
    return inventoryRequestRepository.updateInventoryRequestStatus(requestId, status);
}
