import type { RequestStatus } from 'shared/constants';

export interface InventoryItem {
  itemId: number;
  itemName: string;
  category: string;
  unit: string;
  stockQuantity: number;
  reorderAt: number;
  unitPrice: number;
}

export interface InventoryRequest {
  requestId: number;
  employeeId: number;
  itemId: number;
  itemName?: string;
  requestedQuantity: string;
  requestedUnit: string;
  reason: string;
  requestStatus: RequestStatus;
  createdAt: string;
}

export interface PurchasePlan {
  planId: number;
  createdAt: string;
  totalCost: number;
  status: 'pending' | 'received';
  items: {
    itemId: number;
    itemName: string;
    quantity: number;
    subtotal: number;
  }[];
}

// MOCK DATA since the backend endpoints for inventory are not built yet
let mockInventoryItems: InventoryItem[] = [
  { itemId: 1, itemName: 'Fresh Milk', category: 'Dairy', unit: 'liters', stockQuantity: 3, reorderAt: 10, unitPrice: 90 },
  { itemId: 2, itemName: 'Eggs', category: 'Dairy', unit: 'trays', stockQuantity: 0, reorderAt: 3, unitPrice: 220 },
  { itemId: 3, itemName: 'Butter', category: 'Dairy', unit: 'kg', stockQuantity: 2, reorderAt: 5, unitPrice: 350 },
  { itemId: 4, itemName: 'Coffee Beans', category: 'Beverages', unit: 'kg', stockQuantity: 12, reorderAt: 5, unitPrice: 850 },
  { itemId: 5, itemName: 'Sugar', category: 'Pantry', unit: 'kg', stockQuantity: 8, reorderAt: 3, unitPrice: 85 },
  { itemId: 6, itemName: 'Matcha Powder', category: 'Beverages', unit: 'kg', stockQuantity: 1, reorderAt: 2, unitPrice: 1200 },
  { itemId: 7, itemName: 'Oat Milk', category: 'Dairy', unit: 'liters', stockQuantity: 8, reorderAt: 5, unitPrice: 150 },
  { itemId: 8, itemName: 'Vanilla Syrup', category: 'Pantry', unit: 'bottles', stockQuantity: 4, reorderAt: 4, unitPrice: 450 },
  { itemId: 9, itemName: 'Caramel Sauce', category: 'Pantry', unit: 'bottles', stockQuantity: 0, reorderAt: 3, unitPrice: 380 },
  { itemId: 10, itemName: 'Hot Paper Cups 12oz', category: 'Packaging', unit: 'sleeves', stockQuantity: 15, reorderAt: 10, unitPrice: 180 },
  { itemId: 11, itemName: 'Cold Plastic Cups 16oz', category: 'Packaging', unit: 'sleeves', stockQuantity: 4, reorderAt: 10, unitPrice: 200 },
  { itemId: 12, itemName: 'Napkins', category: 'Packaging', unit: 'packs', stockQuantity: 20, reorderAt: 10, unitPrice: 45 }
];

let mockRequests: InventoryRequest[] = [];
let reqIdCounter = 1;

// Mock Purchase Plans
let mockPurchasePlans: PurchasePlan[] = [];
let planIdCounter = 1;

export const inventoryApi = {
  // Fetch available items to populate the dropdown and tables
  async getInventoryItems(): Promise<InventoryItem[]> {
    // In a real app, this would be: await fetch('/api/inventory/items')
    return [...mockInventoryItems];
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
  },

  // Save a purchase plan from the admin dashboard
  async savePurchasePlan(plan: { items: { itemId: number; itemName: string; quantity: number; subtotal: number }[]; totalCost: number }): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPlan: PurchasePlan = {
          planId: planIdCounter++,
          createdAt: new Date().toISOString(),
          totalCost: plan.totalCost,
          status: 'pending',
          items: plan.items
        };
        mockPurchasePlans.push(newPlan);
        resolve({ success: true, message: 'Purchase plan saved successfully.' });
      }, 800);
    });
  },

  // Get all purchase plans
  async getPurchasePlans(): Promise<PurchasePlan[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockPurchasePlans].sort((a, b) => b.planId - a.planId)), 400);
    });
  },

  // Mark a purchase plan as received and update inventory
  async receivePurchasePlan(planId: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const plan = mockPurchasePlans.find(p => p.planId === planId);
        if (plan && plan.status === 'pending') {
          plan.status = 'received';
          // Update actual inventory stock
          plan.items.forEach(planItem => {
            const inventoryItem = mockInventoryItems.find(i => i.itemId === planItem.itemId);
            if (inventoryItem) {
              inventoryItem.stockQuantity += planItem.quantity;
            }
          });
        }
        resolve();
      }, 500);
    });
  }
};
