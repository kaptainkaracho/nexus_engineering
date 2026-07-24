import { Stack, Card, Grid } from '@nexus-engineering/shared';

export function CardsView() {
  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <h2 className="text-2xl font-bold text-text-primary">Card component</h2>
        <p className="text-text-secondary">
          Three card variants: default (bordered), elevated (shadow), and outlined
          (transparent). Use with Container, Stack, and Grid for layout.
        </p>
      </Stack>

      <Grid cols={3} gap={6}>
        <Card variant="default" padding="lg">
          <Stack gap={3}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text-primary">Default</h3>
            <p className="text-sm text-text-tertiary">
              Bordered card with surface background. Use for standard content containers.
            </p>
          </Stack>
        </Card>

        <Card variant="elevated" padding="lg">
          <Stack gap={3}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text-primary">Elevated</h3>
            <p className="text-sm text-text-tertiary">
              Shadowed card that lifts above the surface. Use for dialogs and feature highlights.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" padding="lg">
          <Stack gap={3}>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-text-primary">Outlined</h3>
            <p className="text-sm text-text-tertiary">
              Transparent background with border. Use for secondary content and sidebar sections.
            </p>
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}
