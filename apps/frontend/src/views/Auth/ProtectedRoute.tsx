import { Card, Container, Stack } from '@nexus-engineering/shared';
import { getCurrentSession } from '../../api/auth';

export type AllowedRole = 'user' | 'admin';

export function hasAccess(allowedRoles?: AllowedRole[]): boolean {
  const session = getCurrentSession();
  if (!session) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(session.user.role);
}

export function isAdmin(): boolean {
  const session = getCurrentSession();
  return session?.user.role === 'admin';
}

export function requireRole(allowedRoles: AllowedRole[]): boolean {
  return hasAccess(allowedRoles);
}

export interface ProtectedLayoutProps {
  allowedRoles?: AllowedRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedLayout({ allowedRoles, children, fallback }: ProtectedLayoutProps) {
  if (hasAccess(allowedRoles)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Container size="sm" className="py-16">
      <Card padding="lg">
        <Stack gap={4} align="center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-950">
            <svg className="h-7 w-7 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.636A9 9 0 1112.363 3a9 9 0 019 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
          <p className="text-center text-sm text-text-tertiary">
            You don&apos;t have the required permissions to access this page.
            Contact your administrator if you need elevated access.
          </p>
        </Stack>
      </Card>
    </Container>
  );
}
