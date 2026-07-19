import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Container, Stack, Input } from '@nexus-engineering/shared';
import {
  fetchTacDocuments,
  fetchTacDocument,
  fetchRequirement,
  type TacDocumentSummary,
  type TacDocument,
  type TacTestCase,
} from '../../api/client';

function TestCaseCard({ testCase }: { testCase: TacTestCase }) {
  const [openTrace, setOpenTrace] = useState<string | null>(null)
  const [reqDetail, setReqDetail] = useState<Record<string, { title?: string; description?: string; priority?: string; status?: string; type?: string; tags?: string[] } | null>>({})
  const [reqLoading, setReqLoading] = useState<string | null>(null)

  const handleTraceClick = useCallback(
    async (targetId: string) => {
      if (openTrace === targetId) {
        setOpenTrace(null)
        return
      }
      setOpenTrace(targetId)
      if (reqDetail[targetId] === undefined) {
        setReqLoading(targetId)
        try {
          const req = await fetchRequirement(targetId)
          setReqDetail((prev) => ({ ...prev, [targetId]: req }))
        } catch {
          setReqDetail((prev) => ({ ...prev, [targetId]: null }))
        } finally {
          setReqLoading(null)
        }
      }
    },
    [openTrace, reqDetail],
  )

  return (
    <Card variant="outlined" padding="md">
      <Stack gap={3}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-tertiary">{testCase.id}</span>
          <Badge variant={testCase.type}>{testCase.type}</Badge>
          <Badge variant={testCase.priority}>{testCase.priority}</Badge>
          {testCase.automated && (
            <Badge variant="automated">Automated</Badge>
          )}
        </div>

        <h4 className="text-base font-semibold text-text-primary">{testCase.title}</h4>

        {testCase.description && (
          <p className="text-sm text-text-secondary">{testCase.description}</p>
        )}

        {testCase.scenario && (
          <div className="rounded-lg border border-border bg-surface-secondary/50 p-3">
            <Stack gap={1}>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                Scenario
              </p>
              <p className="text-sm text-text-primary">
                <span className="font-semibold">Given</span> {testCase.scenario.given}
              </p>
              <p className="text-sm text-text-primary">
                <span className="font-semibold">When</span> {testCase.scenario.when}
              </p>
              <p className="text-sm text-text-primary">
                <span className="font-semibold">Then</span> {testCase.scenario.then}
              </p>
            </Stack>
          </div>
        )}

        {testCase.acceptanceCriteria && testCase.acceptanceCriteria.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Acceptance Criteria
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {testCase.acceptanceCriteria.map((ac, i) => (
                <li key={i}>{ac}</li>
              ))}
            </ul>
          </div>
        )}

        {testCase.steps && testCase.steps.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Steps
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-text-secondary">
              {testCase.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {testCase.expectedResult && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Expected Result
            </p>
            <p className="text-sm text-text-secondary">{testCase.expectedResult}</p>
          </div>
        )}

        {testCase.traceLinks && testCase.traceLinks.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Trace Links
            </p>
            <ul className="space-y-1">
              {testCase.traceLinks.map((link, i) => {
                const isOpen = openTrace === link.target.id
                const detail = reqDetail[link.target.id]
                return (
                  <li key={i} className="text-sm text-text-secondary">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-primary-600 dark:text-primary-300">
                        {link.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTraceClick(link.target.id)}
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? `trace-${link.target.id}` : undefined}
                        className="rounded px-1 font-mono text-xs text-primary-600 underline decoration-dotted underline-offset-2 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
                      >
                        {link.target.id}
                      </button>
                      <span className="font-mono text-xs text-text-tertiary">
                        ({link.target.documentId})
                      </span>
                      {link.confidence && (
                        <span className="text-xs text-text-tertiary">· {link.confidence}</span>
                      )}
                    </div>
                    {isOpen && (
                      <div
                        id={`trace-${link.target.id}`}
                        className="mt-2 rounded-lg border border-border bg-surface-secondary/50 p-3"
                      >
                        {reqLoading === link.target.id && (
                          <p className="text-xs text-text-tertiary">Loading requirement…</p>
                        )}
                        {reqLoading !== link.target.id && detail === null && (
                          <p className="text-xs text-text-tertiary">
                            Requirement “{link.target.id}” could not be loaded.
                          </p>
                        )}
                        {reqLoading !== link.target.id && detail && (
                          <Stack gap={1}>
                            <p className="text-sm font-semibold text-text-primary">
                              {detail.title ?? link.target.id}
                            </p>
                            {detail.description && (
                              <p className="text-xs text-text-secondary">{detail.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {detail.type && (
                                <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-text-tertiary">
                                  {detail.type}
                                </span>
                              )}
                              {detail.priority && (
                                <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-text-tertiary">
                                  {detail.priority}
                                </span>
                              )}
                              {detail.status && (
                                <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-text-tertiary">
                                  {detail.status}
                                </span>
                              )}
                            </div>
                          </Stack>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {testCase.tags && testCase.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {testCase.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-text-tertiary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}

function DocumentDetail({
  doc,
  onBack,
}: {
  doc: TacDocument
  onBack: () => void
}) {
  const { metadata } = doc.nexus
  const { suites } = doc
  const totalCases = useMemo(
    () => suites.reduce((sum, s) => sum + s.cases.length, 0),
    [suites],
  )

  return (
    <Stack gap={6}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{metadata.domain}</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {suites.length} {suites.length === 1 ? 'suite' : 'suites'} · {totalCases}{' '}
            {totalCases === 1 ? 'case' : 'cases'} · v{metadata.version}
          </p>
          <p className="text-xs text-text-tertiary">Source: {metadata.source}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden" aria-label="Back to document list">
          ← Documents
        </Button>
      </div>

      {suites.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-3xl" aria-hidden="true">🧪</span>
            <h4 className="text-lg font-semibold text-text-primary">No Test Suites</h4>
            <p className="max-w-md text-sm text-text-tertiary">
              This document does not declare any test suites yet.
            </p>
          </div>
        </Card>
      ) : (
        suites.map((suite) => (
          <Card key={suite.id} padding="lg">
            <Stack gap={4}>
              <div>
                <h4 className="text-lg font-semibold text-text-primary">{suite.name}</h4>
                {suite.description && (
                  <p className="mt-1 text-sm text-text-secondary">{suite.description}</p>
                )}
                <p className="mt-1 text-xs text-text-tertiary">
                  {suite.cases.length} {suite.cases.length === 1 ? 'case' : 'cases'}
                </p>
              </div>
              <Stack gap={3}>
                {suite.cases.map((tc) => (
                  <TestCaseCard key={tc.id} testCase={tc} />
                ))}
              </Stack>
            </Stack>
          </Card>
        ))
      )}
    </Stack>
  );
}

export function TacViewer() {
  const [documents, setDocuments] = useState<TacDocumentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<TacDocument | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadDocuments = useCallback(async (q: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetchTacDocuments(q || undefined)
      setDocuments(res.data)
      setTotal(res.total)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load TAC documents')
      setDocuments([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void loadDocuments(q)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, loadDocuments])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    setDetailError(null)
    setSelectedDoc(null)
    try {
      const doc = await fetchTacDocument(id)
      if (!doc) throw new Error('Document not found')
      setSelectedDoc(doc)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      void loadDetail(id)
    },
    [loadDetail],
  )

  const handleBack = useCallback(() => {
    setSelectedId(null)
    setSelectedDoc(null)
    setDetailError(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect(id)
      }
    },
    [handleSelect],
  )

  return (
    <Container size="lg">
      <Stack gap={6}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Test Acceptance Criteria</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Browse and inspect test acceptance criteria documents. Search by domain, suite, or
            test case to find coverage across the codebase.
          </p>
        </div>

        {loadError && (
          <Card variant="outlined" padding="md">
            <Stack gap={3}>
              <p className="text-sm text-error-600">Error loading documents: {loadError}</p>
              <Button variant="secondary" size="sm" onClick={() => void loadDocuments(query.trim())}>
                Retry
              </Button>
            </Stack>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside
            className={selectedDoc ? 'hidden lg:block' : 'block'}
            aria-label="TAC document list"
          >
            <Card padding="md">
              <Stack gap={3}>
                <Input
                  label="Search documents"
                  placeholder="Domain, suite, or case…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  fullWidth
                />
                {loading && (
                  <p className="text-sm text-text-tertiary">Loading documents…</p>
                )}
                {!loading && !loadError && documents.length === 0 && (
                  <div className="py-6 text-center">
                    <span className="text-2xl" aria-hidden="true">📂</span>
                    <p className="mt-2 text-sm text-text-tertiary">
                      No documents found{query ? ` for “${query}”` : ''}.
                    </p>
                  </div>
                )}
                {!loading && documents.length > 0 && (
                  <ul className="space-y-1.5" role="listbox" aria-label="TAC documents">
                    {documents.map((doc) => {
                      const isSelected = selectedId === doc.id
                      return (
                        <li key={doc.id} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => handleSelect(doc.id)}
                            onKeyDown={(e) => handleKeyDown(e, doc.id)}
                            aria-current={isSelected ? 'true' : undefined}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500/5'
                                : 'border-border hover:bg-surface-secondary/50'
                            }`}
                          >
                            <span className="block text-sm font-semibold text-text-primary">
                              {doc.domain}
                            </span>
                            <span className="mt-0.5 block text-xs text-text-tertiary">
                              {doc.suiteCount} suites · {doc.caseCount} cases · v{doc.version}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-xs text-text-tertiary">
                              {doc.id}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {total > 0 && (
                  <p className="text-xs text-text-tertiary">
                    {total} {total === 1 ? 'document' : 'documents'}
                  </p>
                )}
              </Stack>
            </Card>
          </aside>

          <section
            className={selectedDoc || detailLoading || detailError ? 'block' : 'hidden lg:block'}
            aria-label="TAC document detail"
          >
            {!selectedId && !detailLoading && !detailError && (
              <Card variant="outlined" padding="lg" className="h-full">
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 py-8 text-center">
                  <span className="text-4xl" aria-hidden="true">📑</span>
                  <h3 className="text-lg font-semibold text-text-primary">Select a Document</h3>
                  <p className="max-w-md text-sm text-text-tertiary">
                    Choose a test acceptance criteria document from the list to view its suites and
                    test cases.
                  </p>
                </div>
              </Card>
            )}

            {detailLoading && (
              <Card padding="lg">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-500" />
                    <p className="text-sm text-text-tertiary">Loading document…</p>
                  </div>
                </div>
              </Card>
            )}

            {detailError && (
              <Card variant="outlined" padding="md">
                <Stack gap={3}>
                  <p className="text-sm text-error-600">{detailError}</p>
                  <Button variant="secondary" size="sm" onClick={() => selectedId && handleSelect(selectedId)}>
                    Retry
                  </Button>
                </Stack>
              </Card>
            )}

            {selectedDoc && !detailLoading && (
              <DocumentDetail doc={selectedDoc} onBack={handleBack} />
            )}
          </section>
        </div>
      </Stack>
    </Container>
  )
}

export default TacViewer;
