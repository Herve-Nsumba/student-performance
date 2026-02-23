const TOKEN_KEY = 'pi_tokens_v3';
const USER_KEY = 'pi_user_v3';

// --- Token storage ---
export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// --- User info storage ---
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// --- Backward-compatible session interface ---
// Layout.jsx, Dashboard.jsx, Analytics.jsx, etc. all call getSession()
// and expect { role, studentId }. This preserves that contract.
export function getSession() {
  const user = getUser();
  if (!user) return null;
  return {
    role: (user.role || '').toLowerCase(),
    studentId: user.student_id || null,
    username: user.username,
    userId: user.id,
  };
}

export function clearSession() {
  clearTokens();
}

export function isLoggedIn() {
  return !!getTokens()?.access;
}
