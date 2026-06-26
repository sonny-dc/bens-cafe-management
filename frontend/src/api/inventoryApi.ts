export interface InventoryItem {
  itemId: number;
  itemName: string;
  unit: string;
  stockQuantity: string;
}

export interface InventoryRequest {
  requestId: number;
  employeeId: number;
  itemId: number;
  itemName?: string;
  requestedQuantity: string;
  requestedUnit: string;
  reason: string;
  requestStatus: 'pending' | 'acknowledged' | 'fulfilled';
  createdAt: string;
}

// MOCK DATA since the backend endpoints for inventory are not built yet
let mockRequests: InventoryRequest[] = [];
let reqIdCounter = 1;

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

  // Fetch the employee's past requests
  async getRequestsByEmployee(employeeId: number): Promise<InventoryRequest[]> {
    return mockRequests.filter(req => req.employeeId === employeeId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Submit a new request
  async createRequest(payload: { employeeId: number; itemId: number; itemName?: string; requestedQuantity: string; requestedUnit: string; reason: string }): Promise<InventoryRequest> {
    const newReq: InventoryRequest = {
      ...payload,
      requestId: reqIdCounter++,
      requestStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    mockRequests.push(newReq);
    return newReq;
  }
};
