import type { EmployeeProfile, RegisterEmployeeInput, UpdateEmployeeInput } from 'shared/models';
import { apiFetch } from './apiFetch';

// Helper for Error handling
async function getApiError(res: Response, fallback: string): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  return new Error(err.message || err.error || fallback);
}

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

