import type { InventoryItem, InventoryRequest, PurchasePlan } from 'shared/models';

export type { InventoryItem, InventoryRequest, PurchasePlan };
export const getAllottedBudget = () => {
  try {
    const saved = localStorage.getItem('restockingAllotment');
    return saved ? parseFloat(saved) : 0;
  } catch {
    return 0;
  }
};
export let globalBudgetUsed = 0;

let mockRequests: InventoryRequest[] = [];
let reqIdCounter = 1;

export const inventoryApi = {
  async getInventoryItems(): Promise<InventoryItem[]> {
    const response = await fetch('http://localhost:3000/api/inventory');
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  async createItem(itemData: Omit<InventoryItem, 'itemId'>): Promise<void> {
    const xmlPayload = `
      <request>
        <itemname>${itemData.itemName}</itemname>
        <category>${itemData.category}</category>
        <unitprice>${itemData.unitPrice}</unitprice>
        <unit>${itemData.unit}</unit>
        <reorderat>${itemData.reorderAt}</reorderat>
        <stockquantity>${itemData.stockQuantity}</stockquantity>
      </request>
    `.trim();

    const response = await fetch('http://localhost:3000/api/inventory/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlPayload
    });

    if (!response.ok) throw new Error('Failed to add item via XML');
  },

  async quickRestockItem(itemId: number, quantity: number, _cost: number): Promise<void> {
    const xmlPayload = `
      <request>
        <itemid>${itemId}</itemid>
        <quantity>${quantity}</quantity>
      </request>
    `.trim();

    const response = await fetch('http://localhost:3000/api/inventory/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlPayload
    });

    if (!response.ok) throw new Error('Failed to restock item via XML');
  },

  async updateItem(_itemId: number, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    return { ...itemData } as InventoryItem;
  },

  async deleteItem(itemId: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/inventory/${itemId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete item');
  },

  async getRequestsByEmployee(employeeId: number): Promise<InventoryRequest[]> {
    return mockRequests
      .filter(req => req.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createRequest(payload: {
    employeeId: number;
    itemId: number;
    itemName?: string;
    requestedQuantity: string;
    requestedUnit: string;
    reason: string;
  }): Promise<InventoryRequest> {
    const newReq: InventoryRequest = {
      ...payload,
      requestId: reqIdCounter++,
      requestStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    mockRequests.push(newReq);
    return newReq;
  },

  async savePurchasePlan(plan: {
    items: { itemId: number; itemName: string; quantity: number; unitPrice: number; subtotal: number }[];
    totalCost: number;
  }): Promise<{ success: boolean; overBudget: boolean; message: string }> {
    const overBudget = plan.totalCost > getAllottedBudget();
    
    const response = await fetch('http://localhost:3000/api/inventory/purchase-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });

    if (!response.ok) throw new Error('Failed to save purchase plan');

    return {
      success: true,
      overBudget,
      message: overBudget
        ? 'Plan saved but it exceeds your allotted budget.'
        : 'Purchase plan saved successfully.'
    };
  },

  async getPurchasePlans(): Promise<PurchasePlan[]> {
    const response = await fetch('http://localhost:3000/api/inventory/purchase-plan');
    if (!response.ok) throw new Error('Failed to fetch purchase plans');
    return response.json();
  },

  async fulfillPurchasePlan(planId: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/inventory/purchase-plan/${planId}/fulfill`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to fulfill plan');
  },

  async deletePurchasePlan(planId: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/inventory/purchase-plan/${planId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete plan');
  },

  async getAllRequests(): Promise<InventoryRequest[]> {
    return [...mockRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async updateRequestStatus(
    requestId: number,
    status: 'acknowledged' | 'fulfilled'
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const req = mockRequests.find(r => r.requestId === requestId);
        if (req) req.requestStatus = status;
        resolve();
      }, 400);
    });
  }
};
