const API_BASE_URL = 'http://localhost:3000/api';

import type { EmployeeProfile, RegisterEmployeeInput, UpdateEmployeeInput } from 'shared/models';

// Helper for Error handling
async function getApiError(res: Response, fallback: string): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  return new Error(err.message || err.error || fallback);
}

export const employeeApi = {
  async getAllEmployees() {
    const res = await fetch(`${API_BASE_URL}/employees`);
    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch employees');
    }
    const json = await res.json();
    return json.data;
  },
  
async create(payload: RegisterEmployeeInput): Promise<EmployeeProfile> {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to create employee');
    }

    const json = await res.json();
    return json.data;
  },
  
  async update(employeeId: number, payload: UpdateEmployeeInput): Promise<EmployeeProfile> {
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to update employee');
    }

    const json = await res.json();
    return json.data;
  },

  async delete(employeeId: number): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to delete employee');
    }

    return true;
  }

}

