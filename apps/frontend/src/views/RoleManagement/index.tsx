import { Card, Container, Stack } from '@nexus-engineering/shared';

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

const roles = [
  { name: 'Admin', users: '\u2014', description: 'Full access to all features and settings', color: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300' },
  { name: 'User', users: '\u2014', description: 'Standard access to application features', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
] as const;

export function RoleManagement() {
  return (
    <Container size="lg" className="py-8">
      <Stack gap={8}>
        <Stack gap={2}>
          <h1 className="text-2xl font-bold text-text-primary">Role Management</h1>
          <p className="text-text-secondary">
            Manage roles and permissions for users across organizations.
          </p>
        </Stack>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.name} padding="lg">
              <Stack gap={4}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.color}`}>
                    <ShieldIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{role.name}</h3>
                    <p className="text-sm text-text-tertiary">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                  <UsersIcon />
                  <span>{role.users} users</span>
                </div>
              </Stack>
            </Card>
          ))}
        </div>

        <Card padding="lg">
          <Stack gap={4}>
            <h2 className="text-lg font-semibold text-text-primary">Permission Assignments</h2>
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-text-tertiary">
                Role-based permission assignments will appear here once the backend API is connected.
              </p>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default RoleManagement;
