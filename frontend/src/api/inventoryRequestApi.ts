import type { 
  InventoryRequestListItem,
  InventoryRequest,
  CreateInventoryRequestInput,
  StaffInventoryRequest
} from 'shared/models';

import {
  REQUEST_STATUS,
  type RequestStatus
} from 'shared/constants';

import { apiFetch } from './apiFetch';
import { inventoryItemApi } from './inventoryItemApi';

type CreateInventoryRequestPayload = CreateInventoryRequestInput;

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};
export const inventoryRequestApi = {

  // Fetch all full inventory requests
  async getAllRequests(): Promise<InventoryRequest[]> {
    const res = await apiFetch('/inventory-requests');
    const json: ApiResponse<InventoryRequest[]> = await res.json();

    if (res.status === 404) {
      return [];
    }

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch inventory requests.');
    }

    return json.data || [];
  },

  async getMyRequests(): Promise<StaffInventoryRequest[]> {
    const res = await apiFetch(`/inventory-requests/my`);

    if (res.status === 404) {
      return [];
    }

    const json: ApiResponse<StaffInventoryRequest[]> = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch your inventory requests.');
    }

    return json.data || [];
  },
  
  // Fetch simplified inventory requests for admin dashboard/list display
  async getAllRequestsSimplified(): Promise<InventoryRequestListItem[]> {
    const res = await apiFetch(`/inventory-requests/simplified`);
    const json: ApiResponse<InventoryRequestListItem[]> = await res.json();

    if (res.status === 404) {
      return [];
    }

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch simplified inventory requests.');
    }

    return json.data || [];
  },
  
  // Fetch one full inventory request by ID
  async getRequestById(requestId: number): Promise<InventoryRequest> {
    const res = await apiFetch(`/inventory-requests/${requestId}`);
    const json: ApiResponse<InventoryRequest> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch inventory request.');
    }

    return json.data;
  },
  
  // Fetch one simplified inventory request by ID
  async getRequestByIdSimplified(requestId: number): Promise<InventoryRequestListItem> {
    const res = await apiFetch(`/inventory-requests/simplified/${requestId}`);
    const json: ApiResponse<InventoryRequestListItem> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch simplified inventory request.');
    }

    return json.data;
  },
  
  // Fetch the employee's past requests
  async getRequestsByEmployee(employeeId: number): Promise<StaffInventoryRequest[]> {
    const [requests, items] = await Promise.all([
      this.getAllRequests(),
      inventoryItemApi.getOptions()
    ]);

    return requests
      .filter(request => request.employeeId === employeeId)
      .map(request => {
        const item = items.find(item => item.itemId === request.itemId);

        return {
          ...request,
          itemName: item?.itemName || `Item #${request.itemId}`
        };
      })
      .sort(
        (a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt))
      );
  },

  // Submit a new inventory request
  async createRequest(payload: CreateInventoryRequestPayload): Promise<InventoryRequest> {
    const res = await apiFetch('/inventory-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const json: ApiResponse<InventoryRequest> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to create inventory request.');
    }

    return json.data;
  },
  
  async updateRequestStatus(
    requestId: number,
    requestStatus: RequestStatus
  ): Promise<InventoryRequest> {
    const res = await apiFetch(`/inventory-requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ requestStatus })
    });

    const json: ApiResponse<InventoryRequest> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to update inventory request status.');
    }

    return json.data;
  },
  
  // Convenience helper for admin dashboard
  async getPendingRequestsSimplified(): Promise<InventoryRequestListItem[]> {
    const requests = await this.getAllRequestsSimplified();

    return requests.filter(
      request => request.requestStatus === REQUEST_STATUS.PENDING
    );
  }
};
