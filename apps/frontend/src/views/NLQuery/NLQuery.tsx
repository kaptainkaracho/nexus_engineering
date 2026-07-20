import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, Container, Button, Badge, Input } from '@nexus-engineering/shared';
import {
  nlQuery,
  type NlQueryResult,
  type NlQuerySuggestion,
} from '../../api/client';

const SUGGESTIONS: NlQuerySuggestion[] = [
  { id: 's1', text: 'Show me all requirements linked to authentication' },
  { id: 's2', text: 'Which features have no test coverage?' },
  { id: 's3', text: 'Find trace gaps between requirements and test cases' },
  { id: 's4', text: 'List all architecture components with high confidence links' },
];

const QUERY_PLACEHOLDER = 'Ask about your codebase…';

function EmptyState() {
  return (
    <Stack gap={6} align="center" style={{ padding: '48px 0' }}>
      <div style={{ fontSize: '32px', lineHeight: 1 }}>🔍</div>
      <Stack gap={2} align="center">
        <p className="text-base font-semibold text-text-primary">Ask a natural language query</p>
        <p className="text-sm text-text-secondary">Type a question above or pick a suggestion to get started</p>
      </Stack>
    </Stack>
  );
}

function ResultCard({ result }: { result: NlQueryResult }) {
  const artifactTypeLabel = result.artifactType.charAt(0).toUpperCase() + result.artifactType.slice(1);
  return (
    <Card padding="md">
      <Stack gap={3}>
        <div className="flex items-center justify-between">
          <Badge variant="info">{artifactTypeLabel}</Badge>
          <span className="text-xs text-text-tertiary">
            Confidence: {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <p className="text-sm font-medium text-text-primary">{result.title}</p>
        <p className="text-sm text-text-secondary">{result.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Source: {result.source}</span>
        </div>
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
            <div className="h-3 w-32 animate-pulse rounded bg-surface-tertiary" />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Stack gap={4} align="center" style={{ padding: '32px 0' }}>
      <div style={{ fontSize: '28px', lineHeight: 1 }}>⚠️</div>
      <Stack gap={2} align="center">
        <p className="text-base font-semibold text-text-primary">Query failed</p>
        <p className="text-sm text-text-secondary">{message}</p>
        <Button variant="primary" onClick={onRetry}>Try again</Button>
      </Stack>
    </Stack>
  );
}

export function NLQuery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NlQueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await nlQuery(query.trim());
      setResults(res);
    } catch {
      setError('Unable to reach the query service. Check your connection and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleQuery();
    }
  };

  const handleSuggestionClick = (suggestion: NlQuerySuggestion) => {
    setQuery(suggestion.text);
    setHasSearched(true);
    setTimeout(() => handleQuery(), 0);
  };

  const handleRetry = () => {
    setError(null);
    handleQuery();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Container size="lg">
      <Stack gap={8}>
        {/* Header */}
        <Stack gap={2}>
          <h2 className="text-2xl font-bold text-text-primary">Natural Language Query</h2>
          <p className="text-text-secondary">
            Ask questions about your codebase, traces, and artifacts in plain English.
          </p>
        </Stack>

        {/* Query Input */}
        <Stack gap={3}>
          <textarea
            ref={inputRef}
            className="w-full resize-none rounded-lg border border-border bg-surface-primary p-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-border-dark dark:focus:ring-primary-800"
            rows={3}
            placeholder={QUERY_PLACEHOLDER}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Natural language query input"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-tertiary">
              Press <kbd className="font-mono text-[10px] bg-surface-tertiary px-1.5 py-0.5 rounded">⌘</kbd> + <kbd className="font-mono text-[10px] bg-surface-tertiary px-1.5 py-0.5 rounded">Enter</kbd> to run
            </span>
            <Button
              variant="primary"
              onClick={handleQuery}
              disabled={!query.trim() || loading}
              loading={loading}
              aria-label="Run query"
            >
              Run Query
            </Button>
          </div>
        </Stack>

        {/* Suggestions (only when no search yet) */}
        {!hasSearched && (
          <Stack gap={4}>
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">Suggestions</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="text-left rounded-lg border border-border bg-surface-primary p-4 text-sm text-text-secondary hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:border-primary-800 dark:hover:bg-primary-950 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                  type="button"
                  aria-label={`Run suggestion: ${suggestion.text}`}
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </Stack>
        )}

        {/* Results */}
        {hasSearched && (
          <Stack gap={4}>
            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={handleRetry} />}
            {!loading && !error && results.length > 0 && (
              <Stack gap={4}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-tertiary">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {results.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </Stack>
            )}
            {!loading && !error && results.length === 0 && hasSearched && (
              <Stack gap={2} align="center" style={{ padding: '24px 0' }}>
                <p className="text-sm text-text-secondary">No results found for your query</p>
                <p className="text-xs text-text-tertiary">Try rephrasing your question</p>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default NLQuery;
