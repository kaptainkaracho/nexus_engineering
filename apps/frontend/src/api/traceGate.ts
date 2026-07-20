/**
 * API client for the Trace Gate subsystem.
 *
 * Endpoints (backend, THE-308):
 *   GET  /api/traceability/gate-config   — current policy
 *   PUT  /api/traceability/gate-config   — update policy
 *   GET  /api/traceability/gate           — evaluate gate with current config
 */

import type { TraceGateConfig, TraceGateResult } from '@nexus-engineering/shared';

const BASE = import.meta.env.VITE_API_URL || '';

/** Fetch the stored gate configuration. Returns null when no config exists yet. */
export async function getGateConfig(): Promise<TraceGateConfig | null> {
  const res = await fetch(`${BASE}/api/traceability/gate-config`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GET /api/traceability/gate-config: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Persist a new gate configuration. Returns the saved config. */
export async function putGateConfig(config: TraceGateConfig): Promise<TraceGateConfig> {
  const res = await fetch(`${BASE}/api/traceability/gate-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    throw new Error(`PUT /api/traceability/gate-config: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Run the gate evaluator with current config (and optional query overrides). */
export async function runGate(overrides?: Partial<TraceGateConfig>): Promise<TraceGateResult> {
  const params = new URLSearchParams();
  if (overrides?.coverageThreshold != null) params.set('coverageThreshold', String(overrides.coverageThreshold));
  if (overrides?.maxGaps != null) params.set('maxGaps', String(overrides.maxGaps));
  if (overrides?.requireTypes?.length) params.set('requireTypes', overrides.requireTypes.join(','));
  if (overrides?.mode) params.set('mode', overrides.mode);

  const url = `${BASE}/api/traceability/gate${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET /api/traceability/gate: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
