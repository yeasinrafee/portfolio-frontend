import axios from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }
        const newToken = await refreshPromise;
        refreshPromise = null;

        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (err) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

  if (!refreshToken) throw new Error('No refresh token found');

  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    null,
    {
      headers: { Authorization: `Bearer ${refreshToken}` },
    },
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  return data.accessToken;
}
