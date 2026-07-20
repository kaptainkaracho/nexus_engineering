import { useRef } from 'react';
import { Button, Stack } from '@nexus-engineering/shared';

const EXAMPLE_QUERIES = [
  'Show me all requirements linked to authentication',
  'Which features have no test coverage?',
  'Find trace gaps between requirements and test cases',
  'List architecture decisions for the RBAC module',
];

interface NLQueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function NLQueryInput({ value, onChange, onSubmit, loading }: NLQueryInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Stack gap={3}>
      <label htmlFor="nl-query-input" className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
        Ask a traceability question
      </label>
      <textarea
        id="nl-query-input"
        ref={inputRef}
        className="w-full resize-none rounded-lg border border-border bg-surface-primary p-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-border-dark dark:focus:ring-primary-800"
        rows={3}
        placeholder={EXAMPLE_QUERIES[0]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Natural language traceability query input"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          Press <kbd className="font-mono text-[10px] bg-surface-tertiary px-1.5 py-0.5 rounded">⌘</kbd> +{' '}
          <kbd className="font-mono text-[10px] bg-surface-tertiary px-1.5 py-0.5 rounded">Enter</kbd> to run
        </span>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          loading={loading}
          aria-label="Run query"
        >
          Run Query
        </Button>
      </div>
    </Stack>
  );
}
