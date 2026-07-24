import { describe, it, expect } from 'vitest';
import {
  adjustedSuccessRate,
  rawSuccessRate,
  computeAdjustedSuccessRate,
  aggregateRuns,
  type ProcessMiningKPI,
  type ProcessRun,
} from './processMining';

describe('adjustedSuccessRate', () => {
  it('returns 0 when no terminal runs', () => {
    expect(adjustedSuccessRate(0, 0)).toBe(0);
  });

  it('calculates rate from succeeded + failed only', () => {
    // 996 / (996 + 496) ≈ 66.76%
    expect(adjustedSuccessRate(996, 496)).toBe(66.76);
  });

  it('returns 100 when all terminal runs succeeded', () => {
    expect(adjustedSuccessRate(10, 0)).toBe(100);
  });

  it('returns 0 when all terminal runs failed', () => {
    expect(adjustedSuccessRate(0, 10)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    expect(adjustedSuccessRate(1, 3)).toBe(25);
    expect(adjustedSuccessRate(1, 6)).toBe(14.29);
  });
});

describe('rawSuccessRate', () => {
  it('returns 0 when totalRuns is 0', () => {
    expect(rawSuccessRate(0, 0)).toBe(0);
  });

  it('includes all runs in denominator', () => {
    // 996 / 1928 ≈ 51.66%
    expect(rawSuccessRate(996, 1928)).toBe(51.66);
  });
});

describe('computeAdjustedSuccessRate', () => {
  it('excludes in-flight from denominator', () => {
    const kpi: ProcessMiningKPI = {
      totalRuns: 1928,
      succeeded: 996,
      failed: 496,
      inFlight: 432,
      rawSuccessRate: 51.66,
      calculatedAt: '2026-07-24T00:00:00Z',
    };
    const result = computeAdjustedSuccessRate(kpi);

    expect(result.terminalRuns).toBe(1492); // 996 + 496
    expect(result.adjustedRate).toBe(66.76);
    expect(result.rawRate).toBe(51.66);
    expect(result.inFlightExcluded).toBe(432);
    expect(result.succeeded).toBe(996);
    expect(result.failed).toBe(496);
  });

  it('returns 0 adjusted rate when no terminal runs', () => {
    const kpi: ProcessMiningKPI = {
      totalRuns: 10,
      succeeded: 0,
      failed: 0,
      inFlight: 10,
      rawSuccessRate: 0,
      calculatedAt: '2026-07-24T00:00:00Z',
    };
    const result = computeAdjustedSuccessRate(kpi);
    expect(result.adjustedRate).toBe(0);
    expect(result.terminalRuns).toBe(0);
  });
});

describe('aggregateRuns', () => {
  it('counts statuses correctly', () => {
    const runs: ProcessRun[] = [
      { id: '1', processId: 'p1', status: 'succeeded', startedAt: '' },
      { id: '2', processId: 'p1', status: 'succeeded', startedAt: '' },
      { id: '3', processId: 'p1', status: 'failed', startedAt: '' },
      { id: '4', processId: 'p1', status: 'running', startedAt: '' },
      { id: '5', processId: 'p1', status: 'pending', startedAt: '' },
      { id: '6', processId: 'p1', status: 'error', startedAt: '' },
    ];
    const kpi = aggregateRuns(runs);

    expect(kpi.succeeded).toBe(2);
    expect(kpi.failed).toBe(2); // failed + error
    expect(kpi.inFlight).toBe(2); // running + pending
    expect(kpi.totalRuns).toBe(6);
    expect(kpi.rawSuccessRate).toBe(33.33); // 2/6
  });

  it('returns all zeros for empty array', () => {
    const kpi = aggregateRuns([]);
    expect(kpi.totalRuns).toBe(0);
    expect(kpi.succeeded).toBe(0);
    expect(kpi.failed).toBe(0);
    expect(kpi.inFlight).toBe(0);
    expect(kpi.rawSuccessRate).toBe(0);
  });
});
