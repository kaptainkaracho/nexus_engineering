import { Container, Stack, Card } from '@nexus-engineering/shared';

export function TraceGraph() {
  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trace Graph</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Visualize traceability relationships across requirements, architecture, and
            tests. Graph visualization and API integration land in Phase 2 and Phase 3.
          </p>
        </div>

        <Card variant="outlined" padding="lg">
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 py-8 text-center">
            <span className="text-4xl" aria-hidden="true">🕸️</span>
            <h3 className="text-lg font-semibold text-text-primary">Scaffold Placeholder</h3>
            <p className="max-w-md text-sm text-text-tertiary">
              This is the Phase 1 scaffold for the AI Trace Graph. The interactive graph
              visualization will be implemented in a later phase.
            </p>
          </div>
        </Card>
      </Stack>
    </Container>
  );
}

export default TraceGraph;
