import { Stack } from '@nexus-engineering/shared';

interface QueryHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
}

export function QueryHistory({ history, onSelect }: QueryHistoryProps) {
  if (history.length === 0) {
    return (
      <Stack gap={2} align="center" style={{ padding: '16px 0' }}>
        <p className="text-sm text-text-tertiary">No recent queries</p>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Recent queries</p>
      <ul className="flex flex-col gap-2">
        {history.map((query, i) => (
          <li key={`${query}-${i}`}>
            <button
              type="button"
              onClick={() => onSelect(query)}
              className="w-full truncate rounded-lg border border-border bg-surface-primary px-3 py-2 text-left text-xs text-text-secondary hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-border-dark dark:hover:border-primary-800 dark:hover:bg-primary-950 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-colors"
              aria-label={`Re-run query: ${query}`}
              title={query}
            >
              {query}
            </button>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
