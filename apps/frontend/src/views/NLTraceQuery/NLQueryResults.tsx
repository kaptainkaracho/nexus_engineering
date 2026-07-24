import { Badge, Card, Stack } from '@nexus-engineering/shared';
import type { NLQueryResult, NLQueryResultItem } from '@nexus-engineering/shared';

interface NLQueryResultsProps {
  result: NLQueryResult | null;
  loading: boolean;
  error: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  requirement: 'Req',
  feature: 'Feat',
  testcase: 'Test',
  test: 'Test',
  adr: 'ADR',
  result: 'Result',
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type.toLowerCase()] ?? type;
}

function ResultCard({ item }: { item: NLQueryResultItem }) {
  return (
    <Card padding="md">
      <Stack gap={3}>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="info">{typeLabel(item.type)}</Badge>
          {item.traceLinks && item.traceLinks.length > 0 && (
            <span className="text-xs text-text-tertiary">
              {item.traceLinks.length} trace link{item.traceLinks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-text-primary">{item.title ?? item.name ?? item.id}</p>
        {item.traceLinks && item.traceLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.traceLinks.map((link, i) => (
              <span
                key={`${link.targetId}-${i}`}
                className="inline-flex items-center gap-1 rounded border border-border bg-surface-secondary px-2 py-1 text-xs text-text-secondary dark:border-border-dark"
                title={`${link.relationshipType} (${link.confidence})`}
              >
                <span className="font-medium text-text-primary">{typeLabel(link.targetType)}</span>
                <span className="text-text-tertiary">→</span>
                <span>{link.targetId}</span>
              </span>
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}

function LoadingState() {
  return (
    <Stack gap={4}>
      {[1, 2, 3].map((i) => (
        <Card key={i} padding="md" aria-busy="true">
          <Stack gap={3}>
            <div className="h-5 w-20 animate-pulse rounded bg-surface-tertiary" />
            <div className="h-4 w-48 animate-pulse rounded bg-surface-tertiary" />
            <div className="h-3 w-full animate-pulse rounded bg-surface-tertiary" />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

function EmptyState() {
  return (
    <Stack gap={2} align="center" className="py-12">
      <div className="text-[28px] leading-none">🔍</div>
      <p className="text-base font-semibold text-text-primary">No results</p>
      <p className="text-sm text-text-secondary">Try rephrasing your question or broadening the scope.</p>
    </Stack>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Stack gap={2} align="center" className="py-8">
      <div className="text-[28px] leading-none">⚠️</div>
      <p className="text-base font-semibold text-text-primary">Query failed</p>
      <p className="text-sm text-text-secondary">{message}</p>
    </Stack>
  );
}

export function NLQueryResults({ result, loading, error }: NLQueryResultsProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!result || result.results.length === 0) return <EmptyState />;

  return (
    <Stack gap={4}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-tertiary">
          {result.totalResults} result{result.totalResults !== 1 ? 's' : ''}
        </p>
        <span className="text-xs text-text-tertiary">
          Intent: {result.metadata.parsedIntent} · {result.metadata.executionTimeMs}ms
        </span>
      </div>
      {result.results.map((item) => (
        <ResultCard key={item.id} item={item} />
      ))}
    </Stack>
  );
}
