// src/lib/api/ApiClient.ts
import { getAuthToken, handleUnauthorizedRedirect } from '@/lib/auth/tokenStorage';

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private normalizeUrl(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
  }

  private async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const fullUrl = this.normalizeUrl(path);
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'x-client-type': 'web',
      ...options?.headers as any,
    };

    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // Bắt mã 401 Unauthorized -> Xoá token và chuyển hướng về /login
      if (res.status === 401) {
        handleUnauthorizedRedirect();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      if (!res.ok) {
        let errorMessage = `API Error: ${res.status} (${res.statusText})`;
        try {
          const errorBody = await res.json();
          errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
          // Fallback text nếu không parse được JSON
        }
        throw new Error(errorMessage);
      }

      if (res.status === 204) return null as T;

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json() as T;
      }

      return await res.text() as unknown as T;
    } catch (error) {
      console.warn(`⚠️ [API Error] ${fullUrl}:`, error);
      throw error;
    }
  }

  get<T = any>(path: string, options: RequestInit & { params?: Record<string, any> } = {}) {
    let url = path;
    if (options.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
      delete options.params;
    }
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'POST', body: isFormData ? body : JSON.stringify(body) });
  }

  put<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'PUT', body: isFormData ? body : JSON.stringify(body) });
  }

  patch<T = any>(path: string, body?: any) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(path, { method: 'PATCH', body: isFormData ? body : JSON.stringify(body) });
  }

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  () => getAuthToken()
);