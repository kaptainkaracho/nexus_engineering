import { getCurrentSession } from '../../api/auth';

export type AllowedRole = 'user' | 'admin';

export interface ProtectedRouteConfig {
  allowedRoles?: AllowedRole[];
  fallback?: 'redirect' | 'component';
}

export function hasAccess(allowedRoles?: AllowedRole[]): boolean {
  const session = getCurrentSession();
  if (!session) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(session.user.role);
}

export function requireRole(allowedRoles: AllowedRole[]): boolean {
  return hasAccess(allowedRoles);
}
