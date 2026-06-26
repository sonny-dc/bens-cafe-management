import type { 
  InventoryRequestListItem,
  InventoryRequest,
  CreateInventoryRequestInput
} from 'shared/models';

import {
  REQUEST_STATUS,
  type RequestStatus
} from 'shared/constants';

type CreateInventoryRequestPayload = Omit<CreateInventoryRequestInput, 'postedAt'>;
export type StaffInventoryRequest = InventoryRequest & { itemName: string };

const API_BASE_URL = 'http://localhost:3000/api';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export interface InventoryItem {
  itemId: number;
  itemName: string;
  unit: string;
  stockQuantity: string;
}


export const inventoryApi = {
  // Fetch available items to populate the dropdown
  async getInventoryItems(): Promise<InventoryItem[]> {
    // In a real app, this would be: await fetch('/api/inventory/items')
    return [
      { itemId: 1, itemName: 'Oat Milk', unit: 'Carton', stockQuantity: '10' },
      { itemId: 2, itemName: 'Whole Milk', unit: 'Gallon', stockQuantity: '5' },
      { itemId: 3, itemName: 'Hot Paper Cups 12oz', unit: 'Sleeve', stockQuantity: '2' },
      { itemId: 4, itemName: 'Espresso Roast Beans', unit: 'Bag', stockQuantity: '4' }
    ];
  },
  
  // Fetch all full inventory requests
  async getAllRequests(): Promise<InventoryRequest[]> {
    const res = await fetch(`${API_BASE_URL}/inventory-requests`);
    const json: ApiResponse<InventoryRequest[]> = await res.json();

    if (res.status === 404) {
      return [];
    }

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch inventory requests.');
    }

    return json.data || [];
  },
  
  // Fetch simplified inventory requests for admin dashboard/list display
  async getAllRequestsSimplified(): Promise<InventoryRequestListItem[]> {
    const res = await fetch(`${API_BASE_URL}/inventory-requests/simplified`);
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
    const res = await fetch(`${API_BASE_URL}/inventory-requests/${requestId}`);
    const json: ApiResponse<InventoryRequest> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch inventory request.');
    }

    return json.data;
  },
  
  // Fetch one simplified inventory request by ID
  async getRequestByIdSimplified(requestId: number): Promise<InventoryRequestListItem> {
    const res = await fetch(`${API_BASE_URL}/inventory-requests/simplified/${requestId}`);
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
      this.getInventoryItems()
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
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  // Submit a new inventory request
  async createRequest(payload: CreateInventoryRequestPayload): Promise<InventoryRequest> {
    const res = await fetch(`${API_BASE_URL}/inventory-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_BASE_URL}/inventory-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
