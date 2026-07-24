export type GateMode = 'warn' | 'block';

export function isGateMode(value: unknown): value is GateMode {
  return value === 'warn' || value === 'block';
}

export interface TraceGateConfig {
  coverageThreshold: number;
  maxGaps: number;
  requireTypes: string[];
  mode: GateMode;
}

export interface GateViolation {
  rule: string;
  message: string;
  actual: number | string[];
  expected: number | string[];
}

export interface GateMetrics {
  coveragePercent: number;
  gapCount: number;
  missingTypes: string[];
}

export interface TraceGateResult {
  pass: boolean;
  mode: GateMode;
  metrics: GateMetrics;
  config: TraceGateConfig;
  violations: GateViolation[];
  evaluatedAt: string;
}

export const DEFAULT_GATE_CONFIG: TraceGateConfig = {
  coverageThreshold: 80,
  maxGaps: 0,
  requireTypes: [],
  mode: 'warn',
};

export function normalizeGateConfig(input: Partial<TraceGateConfig>): TraceGateConfig {
  return {
    coverageThreshold:
      typeof input.coverageThreshold === 'number'
        ? Math.max(0, Math.min(100, Math.round(input.coverageThreshold)))
        : DEFAULT_GATE_CONFIG.coverageThreshold,
    maxGaps:
      typeof input.maxGaps === 'number'
        ? Math.max(0, Math.round(input.maxGaps))
        : DEFAULT_GATE_CONFIG.maxGaps,
    requireTypes: Array.isArray(input.requireTypes)
      ? input.requireTypes
      : DEFAULT_GATE_CONFIG.requireTypes,
    mode: input.mode === 'block' || input.mode === 'warn'
      ? input.mode
      : DEFAULT_GATE_CONFIG.mode,
  };
}

export function evaluateGate(metrics: GateMetrics, config: TraceGateConfig): TraceGateResult {
  const violations: GateViolation[] = [];

  if (metrics.coveragePercent < config.coverageThreshold) {
    violations.push({
      rule: 'coverageThreshold',
      message: `Coverage ${metrics.coveragePercent}% is below threshold ${config.coverageThreshold}%`,
      actual: metrics.coveragePercent,
      expected: config.coverageThreshold,
    });
  }

  if (metrics.gapCount > config.maxGaps) {
    violations.push({
      rule: 'maxGaps',
      message: `${metrics.gapCount} gaps exceed the maximum of ${config.maxGaps}`,
      actual: metrics.gapCount,
      expected: config.maxGaps,
    });
  }

  if (metrics.missingTypes.length > 0) {
    violations.push({
      rule: 'requireTypes',
      message: `Missing required trace link types: ${metrics.missingTypes.join(', ')}`,
      actual: metrics.missingTypes,
      expected: config.requireTypes,
    });
  }

  return {
    pass: violations.length === 0,
    mode: config.mode,
    metrics,
    config,
    violations,
    evaluatedAt: new Date().toISOString(),
  };
}

/** A single config validation failure. */
export interface GateConfigValidationError {
  field: string
  message: string
}

/**
 * Validate and normalize a raw gate config. Returns the normalized `config`
 * alongside any `errors` for malformed fields. Fail-safe: even invalid input
 * yields a normalized config so persistence never throws.
 */
export function validateGateConfig(input: unknown): {
  config?: TraceGateConfig
  errors: GateConfigValidationError[]
} {
  const errors: GateConfigValidationError[] = []
  if (typeof input !== 'object' || input === null) {
    return { errors: [{ field: 'root', message: 'Gate config must be an object' }] }
  }
  const raw = input as Record<string, unknown>

  if (raw.mode !== undefined && raw.mode !== 'block' && raw.mode !== 'warn') {
    errors.push({ field: 'mode', message: "Mode must be 'block' or 'warn'" })
  }
  if (
    raw.coverageThreshold !== undefined &&
    (typeof raw.coverageThreshold !== 'number' || raw.coverageThreshold < 0 || raw.coverageThreshold > 100)
  ) {
    errors.push({ field: 'coverageThreshold', message: 'coverageThreshold must be a number between 0 and 100' })
  }
  if (raw.maxGaps !== undefined && (typeof raw.maxGaps !== 'number' || raw.maxGaps < 0)) {
    errors.push({ field: 'maxGaps', message: 'maxGaps must be a non-negative number' })
  }
  if (
    raw.requireTypes !== undefined &&
    (!Array.isArray(raw.requireTypes) || raw.requireTypes.some(t => typeof t !== 'string'))
  ) {
    errors.push({ field: 'requireTypes', message: 'requireTypes must be an array of strings' })
  }

  const config = normalizeGateConfig(raw as Partial<TraceGateConfig>)
  return { config, errors }
}
