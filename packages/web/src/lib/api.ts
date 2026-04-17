import { useAuthStore } from '@/stores/authStore';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const BASE = `${API_URL}/api/v1`;

let isRefreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  try {
    const stored = localStorage.getItem('refreshToken');
    if (!stored) return null;

    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored }),
    });
    if (!res.ok) {
      localStorage.removeItem('refreshToken');
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
      return null;
    }
    const data = await res.json();
    useAuthStore.getState().setToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  // If 401 try refresh (deduplicate concurrent refresh calls)
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = refreshToken().finally(() => { isRefreshing = null; });
    }
    const newToken = await isRefreshing;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `API error ${res.status}`);
  }

  return res.json();
}
