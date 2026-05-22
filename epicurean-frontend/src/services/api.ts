import axios from 'axios';

export const TOKEN_KEY = 'epicurean_token';
export const USER_KEY = 'epicurean_user';

// In dev, baseURL '/api' is proxied to the NestJS backend (see vite.config.ts).
// In prod, set VITE_API_URL to the backend origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject the JWT on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, only force a re-login if there WAS a token (i.e. the session expired).
// Without a token the caller (e.g. the public menu) handles the error itself,
// so we don't hijack public pages.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Extract a human-friendly message from a NestJS error response.
export function getApiErrorMessage(error: unknown, fallback = 'Algo deu errado.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(' • ') : data.message;
    }
    if (error.message) return error.message;
  }
  return fallback;
}

export default api;
