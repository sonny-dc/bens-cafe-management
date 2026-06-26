import type { RequestStatus } from '../constants/index.js'

export interface InventoryRequest {
  requestId: number;
  employeeId: number;
  itemId: number;
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
  requestStatus: RequestStatus;
  postedAt: Date;
}


export interface CreateInventoryRequestInput {
    employeeId: number;
    itemId: number;
    requestedQuantity: string;
    requestedUnit: string;
    reason: string;
    postedAt: string;
    userId?: number;
}

export interface UpdateInventoryRequestInput {
    requestId: number;
    requestStatus: RequestStatus;
    readAt: string;
}