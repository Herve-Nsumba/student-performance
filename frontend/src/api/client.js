import { getTokens, setTokens, clearTokens } from '../auth/session.js';

const BASE = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://127.0.0.1:8000';

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) {
    clearTokens();
    return null;
  }

  try {
    const res = await fetch(apiUrl('/api/auth/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    const newTokens = { ...tokens, access: data.access };
    setTokens(newTokens);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

export async function fetchJson(path, options = {}) {
  const tokens = getTokens();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(apiUrl(path), { ...options, headers });

  // If 401 and we have a refresh token, try to refresh and retry once
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(apiUrl(path), { ...options, headers });
    } else {
      // Refresh failed -- redirect to login
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    const detail = data && (data.detail || data.error) ? (data.detail || data.error) : '';
    const msg = detail || `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
