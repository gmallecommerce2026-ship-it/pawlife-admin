// src/lib/auth/tokenStorage.ts

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined' || !token) return;
  localStorage.setItem('token', token);
  localStorage.setItem('accessToken', token);
  document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax;`;
  document.cookie = `accessToken=${token}; path=/; max-age=2592000; SameSite=Lax;`;
};

export const clearAuthTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  document.cookie = 'token=; path=/; max-age=0;';
  document.cookie = 'accessToken=; path=/; max-age=0;';
};

export const handleUnauthorizedRedirect = (): void => {
  if (typeof window === 'undefined') return;
  clearAuthTokens();
  
  // Tránh chuyển hướng lặp vô tận nếu đang ở trang auth
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
    window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
  }
};