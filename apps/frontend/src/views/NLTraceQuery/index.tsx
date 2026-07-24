import { useCallback, useEffect, useState } from 'react';
import { Card, Container, Stack } from '@nexus-engineering/shared';
import { fetchNLQuery } from '../../api/client';
import type { NLQueryResult } from '@nexus-engineering/shared';
import { NLQueryInput } from './NLQueryInput';
import { NLQueryResults } from './NLQueryResults';
import { QueryHistory } from './QueryHistory';

const MAX_HISTORY = 10;

export function NLTraceQuery() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const runQuery = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      setLoading(true);
      setError(null);
      setQuery(q);
      try {
        const res = await fetchNLQuery(q);
        if (!res) {
          setError('Unable to process the query. Check your connection and try again.');
          setResult(null);
        } else {
          setResult(res);
        }
      } catch {
        setError('Unable to reach the query service. Check your connection and try again.');
        setResult(null);
      } finally {
        setLoading(false);
        setHistory((prev) => [q, ...prev.filter((h) => h !== q)].slice(0, MAX_HISTORY));
      }
    },
    [],
  );

  useEffect(() => {
    const el = document.getElementById('nl-query-input');
    el?.focus();
  }, []);

  return (
    <Container size="lg">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <Stack gap={8}>
          <Stack gap={2}>
            <h2 className="text-2xl font-bold text-text-primary">Natural Language Query</h2>
            <p className="text-text-secondary">
              Ask questions about your codebase, traces, and artifacts in plain English.
            </p>
          </Stack>

          <Card padding="lg">
            <NLQueryInput value={query} onChange={setQuery} onSubmit={() => runQuery(query)} loading={loading} />
          </Card>

          <NLQueryResults result={result} loading={loading} error={error} />
        </Stack>

        <aside aria-label="Query history">
          <Card padding="md">
            <QueryHistory history={history} onSelect={runQuery} />
          </Card>
        </aside>
      </div>
    </Container>
  );
}

export default NLTraceQuery;
