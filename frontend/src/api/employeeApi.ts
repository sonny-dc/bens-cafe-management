const API_BASE_URL = 'http://localhost:3000/api';

export interface EmployeeProfile {
  employeeId: number;
  userId: number;
  employeeCode: string;
  jobRole: string;
  defaultShiftHours: number;
  hourlyRate: string;
  dailyPay: string;
  employmentStatus: 'active' | 'inactive';
  fullName?: string;
  username?: string;
  role?: string;
}

export const employeeApi = {
  getAll: async (): Promise<EmployeeProfile[]> => {
    const res = await fetch(`${API_BASE_URL}/employees`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    const json = await res.json();
    return json.data;
  },

  create: async (data: any): Promise<EmployeeProfile> => {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create employee');
    }
    const json = await res.json();
    return json.data;
  },

  updateStatus: async (employeeId: number, status: 'active' | 'inactive'): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return true;
  },

  updateHourlyRate: async (employeeId: number, hourlyRate: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/hourly-rate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hourlyRate })
    });
    if (!res.ok) throw new Error('Failed to update hourly rate');
    return true;
  },
  
  updateRole: async (employeeId: number, jobRole: string): Promise<boolean> => {
    // We will use the generic patch for this if we need, or create it.
    // Let's assume there's a PATCH /employees/:id
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobRole })
    });
    if (!res.ok) throw new Error('Failed to update employee details');
    return true;
  },

  delete: async (employeeId: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete employee');
    return true;
  }
};
