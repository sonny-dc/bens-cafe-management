import type { RequestStatus } from '../constants/index.js'

export interface InventoryRequest {
  requestId: number;
  employeeId: number;
  itemId: number | null;
  requestedQuantity: string;
  requestedUnit: string;
  reason: string;
  requestStatus: RequestStatus;
  postedAt: Date;
  readAt: Date | null;
  createdAt: Date;
  userId?: number | null;
  updatedAt: Date | null;
}

export interface StaffInventoryRequest extends InventoryRequest {
  itemName: string;
}

/**
 * For get all inventory requests, we return a 
 * simplified version of the request with only the 
 * necessary fields for display in a list.
 */
export interface InventoryRequestListItem {
  requestId: number;
  itemName: string;
  quantity: string;
  requestedBy: string;
  reason: string;
  requestStatus: RequestStatus;
  postedAt: Date;
}


export interface CreateInventoryRequestInput {
    itemId: number;
    requestedQuantity: string;
    requestedUnit: string;
    reason: string;
    userId?: number;
}

export interface CreateInventoryRequestRepositoryInput
 extends CreateInventoryRequestInput {
  employeeId: number;
  postedAt: string;
 }

export interface UpdateInventoryRequestInput {
    userId: number;
    requestId: number;
    requestStatus: RequestStatus;
    readAt: string;
}