import { inventoryRequestRepository } from '../repositories/index.js';
import type { CreateInventoryRequestInput, UpdateInventoryRequestInput, InventoryRequestListItem, InventoryRequest, StaffInventoryRequest } from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';


export async function getInventoryRequestById(requestId: number): Promise<InventoryRequest | null> {
    return inventoryRequestRepository.getInventoryRequestById(requestId);
}

export async function getInventoryRequestByIdSimplified(requestId: number): Promise<InventoryRequestListItem | null> {
    return inventoryRequestRepository.getInventoryRequestListItemById(requestId);
}

export async function getAllInventoryRequests(): Promise<InventoryRequest[]> {
    return inventoryRequestRepository.getAllInventoryRequests();
}

export async function getAllInventoryRequestsSimplified(): Promise<InventoryRequestListItem[]> {
    return inventoryRequestRepository.getAllInventoryRequestListItems();
}

export async function getMyInventoryRequests(employeeId: number): Promise<StaffInventoryRequest[]> {
    return inventoryRequestRepository.getAllInventoryRequestsByEmployeeId(employeeId);
}

export async function createInventoryRequest(input: CreateInventoryRequestInput & { employeeId: number }): Promise<InventoryRequest> {
    return inventoryRequestRepository.createInventoryRequest({ ...input, postedAt: getCurrentAppDateTime() });
}

export async function updateInventoryRequestStatus(input: UpdateInventoryRequestInput): Promise<InventoryRequest | null> {
    return inventoryRequestRepository.updateInventoryRequestStatus({...input, readAt: getCurrentAppDateTime()});
}
