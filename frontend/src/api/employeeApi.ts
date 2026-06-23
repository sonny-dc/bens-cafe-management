const API_BASE_URL = 'http://localhost:3000/api';

export const employeeApi = {
  async getEmployees() {
    const res = await fetch(`${API_BASE_URL}/employees`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch employees');
    }
    const json = await res.json();
    return json.data;
  }
};
