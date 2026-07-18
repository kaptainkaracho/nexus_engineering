import { Card, Container, Stack } from '@nexus-engineering/shared';

function BuildingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

const stats = [
  { label: 'Active Organizations', value: '\u2014', color: 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300' },
  { label: 'Total Users', value: '\u2014', color: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300' },
  { label: 'Admin Roles', value: '\u2014', color: 'bg-info-50 text-info-600 dark:bg-info-950 dark:text-info-300' },
] as const;

export function AdminDashboard() {
  return (
    <Container size="lg" className="py-8">
      <Stack gap={8}>
        <Stack gap={2}>
          <h1 className="text-2xl font-bold text-text-primary">Organization Management</h1>
          <p className="text-text-secondary">
            Manage organizations, view members, and configure settings.
          </p>
        </Stack>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg">
              <Stack gap={3}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <BuildingIcon />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-sm text-text-tertiary">{stat.label}</p>
                </div>
              </Stack>
            </Card>
          ))}
        </div>

        <Card padding="lg">
          <Stack gap={4}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Organizations</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                <PlusIcon />
                Add Organization
              </button>
            </div>
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-text-tertiary">
                No organizations yet. Organizations and their members will appear here once the backend API is connected.
              </p>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default AdminDashboard;
