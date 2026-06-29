import type { EmployeeProfile, RegisterEmployeeInput, UpdateEmployeeInput } from 'shared/models';
import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';

export const employeeApi = {
  async getAllEmployees() {
    const res = await apiFetch('/employees');
    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch employees');
    }
    const json = await res.json();
    return json.data;
  },
  async getEmployeeProfiles() {
    const res = await apiFetch('/employees/profiles');
    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch employee profiles');
    }
    const json = await res.json();
    return json.data;
  },
  
  async getMyProfile(): Promise<EmployeeProfile> {
    const res = await apiFetch('/employees/me');

    if (!res.ok) {
      throw await getApiError(res, 'Failed to fetch current employee profile');
    }

    const json = await res.json();
    return json.data;
  },
  
  async create(payload: RegisterEmployeeInput): Promise<EmployeeProfile> {
    const res = await apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to create employee');
    }

    const json = await res.json();
    return json.data;
  },
  
  async update(employeeId: number, payload: UpdateEmployeeInput): Promise<EmployeeProfile> {
    const res = await apiFetch(`/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to update employee');
    }

    const json = await res.json();
    return json.data;
  },

  async delete(employeeId: number): Promise<boolean> {
    const res = await apiFetch(`/employees/${employeeId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw await getApiError(res, 'Failed to delete employee');
    }

    return true;
  }
}

