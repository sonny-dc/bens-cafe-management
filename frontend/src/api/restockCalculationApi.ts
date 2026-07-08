import type {
  CreateRestockCalculationInput,
  RestockCalculation,
  RestockCalculationItemWithInventoryDetails
} from 'shared/models';

import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

export type ExecuteRestockCalculationResult = {
  restockCalculation: RestockCalculation;
  restockCalculationItems: RestockCalculationItemWithInventoryDetails[];
};

export const restockCalculationApi = {
  /**
   * POST /api/restock-calculations
   * Executes a full restock transaction.
   */
  async create(
    payload: CreateRestockCalculationInput
  ): Promise<ExecuteRestockCalculationResult> {
    const res = await apiFetch('/restock-calculations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to execute restock calculation.');
    }

    const json: ApiResponse<ExecuteRestockCalculationResult> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to execute restock calculation.');
    }

    return json.data;
  },

  /**
   * GET /api/restock-calculations
   */
  async getAll(): Promise<RestockCalculation[]> {
    const res = await apiFetch('/restock-calculations');

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch restock calculations.');
    }

    const json: ApiResponse<RestockCalculation[]> = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch restock calculations.');
    }

    return json.data || [];
  },

  /**
   * GET /api/restock-calculations/:calculationId
   */
  async getById(
    calculationId: number
  ): Promise<ExecuteRestockCalculationResult> {
    const res = await apiFetch(`/restock-calculations/${calculationId}`);

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch restock calculation.');
    }

    const json: ApiResponse<ExecuteRestockCalculationResult> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.message || 'Failed to fetch restock calculation.');
    }

    return json.data;
  }
};
