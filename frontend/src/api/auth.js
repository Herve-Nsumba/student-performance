import { apiUrl } from './client.js';
import { setTokens, setUser, clearTokens } from '../auth/session.js';

export async function login(username, password) {
  const res = await fetch(apiUrl('/api/auth/login/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Invalid credentials');
  }

  const tokens = await res.json();
  setTokens(tokens);

  // Immediately fetch user info
  const meRes = await fetch(apiUrl('/api/auth/me/'), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.access}`,
    },
  });

  if (!meRes.ok) {
    throw new Error('Failed to fetch user info');
  }

  const user = await meRes.json();
  setUser(user);
  return user;
}

export function logout() {
  clearTokens();
}

// ─── Login-options (public, no token needed) ────────────────────

export async function fetchTeacherOptions() {
  const res = await fetch(apiUrl('/api/auth/login-options/teachers/'));
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStudentOptions() {
  const res = await fetch(apiUrl('/api/auth/login-options/students/'));
  if (!res.ok) return [];
  return res.json();
}
