const BASE = import.meta.env.VITE_API_URL || '';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

function getStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem('auth_session');
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionStorage.removeItem('auth_session');
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem('auth_session');
    return null;
  }
}

function storeSession(session: AuthSession): void {
  sessionStorage.setItem('auth_session', JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem('auth_session');
}

export function getCurrentSession(): AuthSession | null {
  return getStoredSession();
}

export async function login(credentials: LoginRequest): Promise<AuthSession> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err: AuthError = await res.json().catch(() => ({
      message: `Login failed (HTTP ${res.status})`,
    }));
    throw err;
  }

  const session: AuthSession = await res.json();
  storeSession(session);
  return session;
}

export async function register(data: RegisterRequest): Promise<AuthSession> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err: AuthError = await res.json().catch(() => ({
      message: `Registration failed (HTTP ${res.status})`,
    }));
    throw err;
  }

  const session: AuthSession = await res.json();
  storeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = getStoredSession();
  if (session) {
    try {
      await fetch(`${BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      });
    } catch {
      // Best-effort; clear session locally regardless
    }
  }
  clearSession();
}

export async function fetchSession(): Promise<AuthSession | null> {
  const stored = getStoredSession();
  if (!stored) return null;

  try {
    const res = await fetch(`${BASE}/api/auth/session`, {
      headers: { Authorization: `Bearer ${stored.token}` },
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const session: AuthSession = await res.json();
    storeSession(session);
    return session;
  } catch {
    return stored;
  }
}
