import { inventoryRequestRepository } from '../repositories/index.js';
import type { CreateInventoryRequestInput, UpdateInventoryRequestInput, InventoryRequestListItem } from '../models/index.js';
import { getCurrentAppDateTime } from '../utils/datetime.utils.js';

export async function getAllInventoryRequests(): Promise<InventoryRequestListItem[]> {
    return inventoryRequestRepository.getAllInventoryRequests();
}

export async function createInventoryRequest(input: Omit<CreateInventoryRequestInput, 'postedAt'>): Promise<number> {
    return inventoryRequestRepository.createInventoryRequest({...input, postedAt: getCurrentAppDateTime()});
}

export async function updateInventoryRequestStatus(input: UpdateInventoryRequestInput): Promise<boolean> {
    return inventoryRequestRepository.updateInventoryRequestStatus({...input, readAt: getCurrentAppDateTime()});
}
