import { Stack, Card, Grid, Button } from '@nexus-engineering/shared';

export function ButtonsView() {
  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <h2 className="text-2xl font-bold text-text-primary">Button component</h2>
        <p className="text-text-secondary">
          4 variants, 3 sizes, loading state, icon support. Uses semantic
          tokens for dark mode compatibility.
        </p>
      </Stack>

      <Card padding="lg">
        <Stack gap={6}>
          <Stack gap={3}>
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              Variants
            </p>
            <Stack direction="row" gap={3} wrap>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </Stack>
          </Stack>

          <Stack gap={3}>
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              Sizes
            </p>
            <Stack direction="row" gap={3} align="center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Stack>
          </Stack>

          <Stack gap={3}>
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              With icons
            </p>
            <Stack direction="row" gap={3} wrap>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
              <Button variant="ghost" disabled>
                Disabled
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
