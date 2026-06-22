import { inventoryRequestRepository } from '../repositories/index.js';

export async function getAllInventoryRequests(): Promise<any[]> {
    return inventoryRequestRepository.getAllInventoryRequests();
}

export async function updateInventoryRequestStatus(requestId: number, status: string): Promise<boolean> {
    return inventoryRequestRepository.updateInventoryRequestStatus(requestId, status);
}
