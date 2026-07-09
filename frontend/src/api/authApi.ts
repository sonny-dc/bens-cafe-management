import { USER_ROLES, type UserRole } from 'shared/constants';
import { apiFetch } from './apiFetch';
import { getApiError } from './apiError';
import type { ApiResponse } from './apiResponse';

type LoginResponseData = {
  user: {
    role: UserRole;
  };
};

type LoginInput = {
  username: string;
  password: string;
};

export const authApi = {
  async login(input: LoginInput): Promise<UserRole> {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: input.username,
        password: input.password
      })
    });

    if (!response.ok) {
      throw await getApiError(response, 'Invalid username or password.');
    }

    const json: ApiResponse<LoginResponseData> = await response.json();

    if (!json.success || !json.data?.user?.role) {
      throw new Error(json.message || 'Failed to sign in.');
    }

    const role = json.data.user.role;

    if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.EMPLOYEE) {
      throw new Error('Invalid user role.');
    }

    return role;
  }
};
