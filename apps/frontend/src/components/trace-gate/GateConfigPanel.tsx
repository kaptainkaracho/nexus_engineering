import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Input, RadioGroup, Stack } from '@nexus-engineering/shared';
import { GateStatusBadge } from './GateStatusBadge';
import { getGateConfig, putGateConfig, runGate } from '../../api/traceGate';
import type { TraceGateConfig, TraceGateResult, GateViolation } from '@nexus-engineering/shared';

const AVAILABLE_TYPES = ['requirement', 'feature', 'testCase', 'architectureModel', 'softwareComponent', 'result'];

const DEFAULT_CONFIG: TraceGateConfig = {
  coverageThreshold: 80,
  maxGaps: 0,
  requireTypes: [],
  mode: 'warn',
};

function violationIcon(v: GateViolation): string {
  if (v.rule === 'coverageThreshold') return '📊';
  if (v.rule === 'maxGaps') return '🔗';
  if (v.rule === 'requireTypes') return '📋';
  return '⚠️';
}

function formatViolationMessage(v: GateViolation): string {
  if (typeof v.actual === 'number') {
    return `${v.message} (actual: ${v.actual}, expected: ${v.expected})`;
  }
  if (Array.isArray(v.actual)) {
    return `${v.message} (actual: [${v.actual.join(', ')}], expected: [${(v.expected as string[]).join(', ')}])`;
  }
  return v.message;
}

interface GateConfigPanelProps {
  className?: string;
}

export function GateConfigPanel({ className = '' }: GateConfigPanelProps) {
  const [config, setConfig] = useState<TraceGateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TraceGateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<TraceGateConfig>(DEFAULT_CONFIG);

  // Inline validation (THE-311 #6: error prevention before save)
  const validationErrors = useMemo<Record<string, string>>(() => {
    const errs: Record<string, string> = {};
    if (
      Number.isNaN(editConfig.coverageThreshold) ||
      editConfig.coverageThreshold < 0 ||
      editConfig.coverageThreshold > 100
    ) {
      errs.coverageThreshold = 'Must be a number between 0 and 100.';
    }
    if (!Number.isInteger(editConfig.maxGaps) || editConfig.maxGaps < 0) {
      errs.maxGaps = 'Must be a whole number of 0 or more.';
    }
    return errs;
  }, [editConfig.coverageThreshold, editConfig.maxGaps]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Load current config on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getGateConfig();
        if (!cancelled) {
          setConfig(cfg ?? DEFAULT_CONFIG);
          setEditConfig(cfg ?? { ...DEFAULT_CONFIG });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load gate config');
          setConfig(DEFAULT_CONFIG);
          setEditConfig({ ...DEFAULT_CONFIG });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    if (hasValidationErrors) {
      setError('Please fix the highlighted fields before saving.');
      setSaving(false);
      return;
    }
    try {
      const saved = await putGateConfig(editConfig);
      setConfig(saved);
      setSuccessMsg('Configuration saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  }, [editConfig]);

  const handleTestGate = useCallback(async () => {
    setTesting(true);
    setError(null);
    setResult(null);
    try {
      const res = await runGate(editConfig);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gate evaluation failed.');
    } finally {
      setTesting(false);
    }
  }, [editConfig]);

  const handleTypeToggle = useCallback((type: string) => {
    setEditConfig(prev => ({
      ...prev,
      requireTypes: prev.requireTypes.includes(type)
        ? prev.requireTypes.filter(t => t !== type)
        : [...prev.requireTypes, type],
    }));
  }, []);

  if (loading) {
    return (
      <Container size="lg" className={className}>
        <Card padding="lg">
          <Stack gap={12}>
            <div className="h-6 w-48 animate-pulse rounded bg-surface-tertiary" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface-tertiary" />
            <div className="h-32 w-full animate-pulse rounded bg-surface-tertiary" />
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className={className}>
      <Stack gap={16}>
        {/* Header */}
        <Stack gap={4}>
          <h2 className="text-2xl font-bold text-text-primary">Trace Gate Configuration</h2>
          <p className="text-text-secondary">
            Define the trace-health policy that CI/CD gates enforce. In <Badge variant="info">warn</Badge> mode
            failing gates annotate only; in <Badge variant="critical">block</Badge> mode they fail the build.
          </p>
        </Stack>

        {/* Alert messages */}
        {successMsg && (
          <Alert variant="success" className="rounded-lg p-3">
            {successMsg}
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="rounded-lg p-3">
            {error}
          </Alert>
        )}

        {/* Configuration Card */}
        <Card padding="lg">
          <Stack gap={16}>
            <h3 className="text-lg font-semibold text-text-primary">Policy</h3>

            {/* Coverage Threshold */}
            <Stack gap={4}>
              <label htmlFor="coverageThreshold" className="text-sm font-medium text-text-primary">
                Coverage Threshold (%)
              </label>
              <Input
                id="coverageThreshold"
                type="number"
                min={0}
                max={100}
                value={editConfig.coverageThreshold}
                onChange={(e) => setEditConfig((prev: TraceGateConfig) => ({ ...prev, coverageThreshold: Number(e.currentTarget.value) || 0 }))}
                helperText="Minimum overall trace coverage percentage (0–100)"
                aria-invalid={Boolean(validationErrors.coverageThreshold)}
                fullWidth
              />
              {validationErrors.coverageThreshold && (
                <p className="text-xs font-medium text-error-600 dark:text-error-400" role="alert">
                  {validationErrors.coverageThreshold}
                </p>
              )}
            </Stack>

            {/* Max Gaps */}
            <Stack gap={4}>
              <label htmlFor="maxGaps" className="text-sm font-medium text-text-primary">
                Maximum Allowed Gaps
              </label>
              <Input
                id="maxGaps"
                type="number"
                min={0}
                value={editConfig.maxGaps}
                onChange={(e) => setEditConfig(prev => ({ ...prev, maxGaps: Number(e.target.value) || 0 }))}
                helperText="Maximum number of cross-artifact gaps allowed"
                aria-invalid={Boolean(validationErrors.maxGaps)}
                fullWidth
              />
              {validationErrors.maxGaps && (
                <p className="text-xs font-medium text-error-600 dark:text-error-400" role="alert">
                  {validationErrors.maxGaps}
                </p>
              )}
            </Stack>

            {/* Required Types */}
            <Stack gap={4}>
              <p className="text-sm font-medium text-text-primary">
                Required Trace Link Types
              </p>
              <p className="text-xs text-text-tertiary">
                Select the artifact types that must be present in the graph for the gate to pass.
              </p>
              <Stack direction="row" gap={3} wrap className="flex-wrap">
                {AVAILABLE_TYPES.map(type => {
                  const active = editConfig.requireTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeToggle(type)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                          : 'bg-surface-tertiary text-text-tertiary hover:bg-surface-tertiary/70'
                      }`}
                      role="checkbox"
                      aria-checked={active}
                      aria-label={`${type} trace type`}
                    >
                      {type}
                    </button>
                  );
                })}
              </Stack>
            </Stack>

            {/* Mode */}
            <Stack gap={4}>
              <p className="text-sm font-medium text-text-primary">
                Gate Mode
              </p>
              {editConfig.mode === 'block' && (
                <Alert variant="warning" className="rounded-lg p-3">
                  Block mode will fail CI when the policy is not met. Test your current
                  configuration with <strong>Test Gate</strong> before saving to avoid breaking the build.
                </Alert>
              )}
              <RadioGroup
                name="mode"
                label="Mode"
                value={editConfig.mode}
                options={[
                  { value: 'warn', label: 'Warn — annotate only (non-blocking)' },
                  { value: 'block', label: 'Block — fail the CI job on gate failure' },
                ]}
                onChange={(value) => setEditConfig(prev => ({ ...prev, mode: value }))}
              />
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" gap={3} className="pt-2">
              <Button variant="primary" onClick={handleSave} disabled={saving || hasValidationErrors}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button variant="secondary" onClick={handleTestGate} disabled={testing}>
                {testing ? 'Testing...' : 'Test Gate'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditConfig(config ? { ...config } : { ...DEFAULT_CONFIG });
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Card>

        {/* Current Config Summary */}
        {config && (
          <Card padding="lg">
            <h3 className="mb-3 text-sm font-semibold text-text-tertiary uppercase tracking-wide">
              Current Configuration
            </h3>
            <Stack gap={2}>
              <p className="text-sm text-text-primary">
                Coverage threshold: <strong>{config.coverageThreshold}%</strong>
              </p>
              <p className="text-sm text-text-primary">
                Max gaps: <strong>{config.maxGaps}</strong>
              </p>
              <p className="text-sm text-text-primary">
                Required types: <strong>{config.requireTypes.length > 0 ? config.requireTypes.join(', ') : '(none)'}</strong>
              </p>
              <p className="text-sm text-text-primary">
                Mode: <Badge variant={config.mode === 'block' ? 'critical' : 'info'}>{config.mode}</Badge>
              </p>
            </Stack>
          </Card>
        )}

        {/* Gate Test Result */}
        {result && (
          <Card padding="lg">
            <Stack gap={12}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Gate Evaluation Result</h3>
                <GateStatusBadge pass={result.pass} mode={result.mode} size="lg" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-surface-tertiary p-3">
                  <p className="text-xs text-text-tertiary">Coverage</p>
                  <p className="text-lg font-bold text-text-primary">{result.metrics.coveragePercent}%</p>
                </div>
                <div className="rounded-lg bg-surface-tertiary p-3">
                  <p className="text-xs text-text-tertiary">Gap Count</p>
                  <p className="text-lg font-bold text-text-primary">{result.metrics.gapCount}</p>
                </div>
                <div className="rounded-lg bg-surface-tertiary p-3">
                  <p className="text-xs text-text-tertiary">Threshold</p>
                  <p className="text-lg font-bold text-text-primary">{result.config.coverageThreshold}%</p>
                </div>
                <div className="rounded-lg bg-surface-tertiary p-3">
                  <p className="text-xs text-text-tertiary">Max Gaps</p>
                  <p className="text-lg font-bold text-text-primary">{result.config.maxGaps}</p>
                </div>
              </div>

              {result.violations.length > 0 && (
                <Stack gap={4}>
                  <p className="text-sm font-semibold text-error-600 dark:text-error-400">
                    Violations ({result.violations.length})
                  </p>
                  {result.violations.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-300">
                      <span className="mt-0.5 shrink-0">{violationIcon(v)}</span>
                      <span>{formatViolationMessage(v)}</span>
                    </div>
                  ))}
                </Stack>
              )}

              {result.violations.length === 0 && (
                <div className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-300">
                  No violations — all policy rules satisfied.
                </div>
              )}

              <p className="text-xs text-text-tertiary">
                Evaluated at: {new Date(result.evaluatedAt).toLocaleString()}
              </p>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
