export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'travel' | 'konsultan' | 'pengguna' | 'pengawas';
  company_id?: string | null;
};

export type AuthSession = {
  token: string;
  user: User;
};

const TOKEN_KEY = 'kemenhaj-token';
const USER_KEY = 'kemenhaj-user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return Boolean(token && (sessionExpiresAt(token) ?? 0) > Date.now());
}

// Decode expiry only for UI logout timing. The API still verifies the JWT signature.
export function sessionExpiresAt(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp > 0
      && Number.isFinite(payload.exp * 1000) ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function expireSession(expectedToken: string) {
  // A late 401 from an old request must not sign out a newer login.
  if (getToken() !== expectedToken) return;
  clearSession();
  window.dispatchEvent(new Event('kemenhaj-session-expired'));
}

// Recheck on tab wake and storage changes because background timers can be paused.
export function watchSessionExpiration(onSession: () => void, onRemoved: () => void): () => void {
  let timer: number | undefined;
  let previousToken = getToken();
  const check = () => {
    window.clearTimeout(timer);
    const token = getToken();
    if (!token) {
      if (previousToken) onRemoved();
      previousToken = null;
      onSession();
      return;
    }
    previousToken = token;
    const remaining = (sessionExpiresAt(token) ?? 0) - Date.now();
    if (remaining <= 0) { expireSession(token); return; }
    onSession();
    timer = window.setTimeout(check, Math.min(remaining, 2147483647));
  };
  const storage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null) check();
  };
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('storage', storage);
  check();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('focus', check);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('storage', storage);
  };
}

export function setSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();

  if (token && path !== '/auth/login' && (sessionExpiresAt(token) ?? 0) <= Date.now()) {
    expireSession(token);
    throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.');
  }
  if (token && path !== '/auth/login') headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token && path !== '/auth/login') {
      expireSession(token);
    }
    throw new Error((data as { error?: string }).error || 'Terjadi kesalahan');
  }

  return data as T;
}
