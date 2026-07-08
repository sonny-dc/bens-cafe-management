import type {
  InventoryItem,
  InventoryItemListItem,
  InventoryItemOption,
  CreateInventoryItemInput,
  UpdateInventoryItemInput
} from 'shared/models';

import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

type CreateInventoryItemPayload = Omit<CreateInventoryItemInput, 'userId'>;

type UpdateInventoryItemPayload = Omit<
  UpdateInventoryItemInput,
  'itemId' | 'userId'
>;

export const inventoryItemApi = {
  /**
   * GET /api/inventory-items
   * Full inventory item records.
   */
  async getAll(): Promise<InventoryItem[]> {
    const res = await apiFetch('/inventory-items');

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory items.');
    }

    const json: ApiResponse<InventoryItem[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch inventory items.');
    }

    return json.data || [];
  },

  /**
   * GET /api/inventory-items/list
   * Simplified items for AdminInventory table.
   */
  async getList(): Promise<InventoryItemListItem[]> {
    const res = await apiFetch('/inventory-items/list');

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory item list.');
    }

    const json: ApiResponse<InventoryItemListItem[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch inventory item list.');
    }

    return json.data || [];
  },

  /**
   * GET /api/inventory-items/options
   * Lightweight dropdown items for request forms.
   */
  async getOptions(): Promise<InventoryItemOption[]> {
    const res = await apiFetch('/inventory-items/options');

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory item options.');
    }

    const json: ApiResponse<InventoryItemOption[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch inventory item options.');
    }

    return json.data || [];
  },

  /**
   * GET /api/inventory-items/:itemId
   */
  async getById(itemId: number): Promise<InventoryItem> {
    const res = await apiFetch(`/inventory-items/${itemId}`);

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch inventory item.');
    }

    const json: ApiResponse<InventoryItem> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch inventory item.');
    }

    return json.data;
  },

  /**
   * POST /api/inventory-items
   * userId is not sent by frontend.
   * Backend gets userId from req.session.user.
   */
  async create(payload: CreateInventoryItemPayload): Promise<InventoryItem> {
    const res = await apiFetch('/inventory-items', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to create inventory item.');
    }

    const json: ApiResponse<InventoryItem> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to create inventory item.');
    }

    return json.data;
  },

  /**
   * PATCH /api/inventory-items/:itemId
   * itemId is in URL.
   * userId is handled by backend session.
   */
  async update(
    itemId: number,
    payload: UpdateInventoryItemPayload
  ): Promise<InventoryItem> {
    const res = await apiFetch(`/inventory-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to update inventory item.');
    }

    const json: ApiResponse<InventoryItem> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to update inventory item.');
    }

    return json.data;
  },

  /**
   * DELETE /api/inventory-items/:itemId
   */
  async delete(itemId: number): Promise<boolean> {
    const res = await apiFetch(`/inventory-items/${itemId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to delete inventory item.');
    }

    const json: ApiResponse<{ success: boolean }> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to delete inventory item.');
    }

    return true;
  }
};
