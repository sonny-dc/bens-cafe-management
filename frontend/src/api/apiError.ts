export type BackendValidationErrors = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  errors?: BackendValidationErrors;

  constructor(
    message: string,
    status: number,
    errors?: BackendValidationErrors
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function getApiError(
  res: Response,
  fallback: string
): Promise<ApiError> {
  const err = await res.json().catch(() => ({}));

  return new ApiError(
    err.message || err.error || fallback,
    res.status,
    err.errors
  );
}