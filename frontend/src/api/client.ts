const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bookleaf_access_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear tokens if we are on a protected page
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('bookleaf_access_token');
      localStorage.removeItem('bookleaf_refresh_token');
      localStorage.removeItem('bookleaf_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorDetail =
      responseData && typeof responseData === 'object' && responseData.detail
        ? responseData.detail
        : response.statusText || 'An unexpected error occurred';
    throw new ApiError(response.status, errorDetail, responseData);
  }

  return responseData as T;
}

export const api = {
  get: <T>(url: string, headers?: HeadersInit) =>
    request<T>(url, { method: 'GET', headers }),
  post: <T>(url: string, body?: any, headers?: HeadersInit) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
  patch: <T>(url: string, body?: any, headers?: HeadersInit) =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
  delete: <T>(url: string, headers?: HeadersInit) =>
    request<T>(url, { method: 'DELETE', headers }),
};
