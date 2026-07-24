import { describe, it, expect } from 'vitest'
import { evaluateGate, normalizeGateConfig, DEFAULT_GATE_CONFIG } from '@nexus-engineering/shared'

const baseMetrics = { coveragePercent: 90, gapCount: 0, missingTypes: [] as string[] }

describe('evaluateGate', () => {
  it('passes when metrics satisfy the default policy', () => {
    const result = evaluateGate(baseMetrics, DEFAULT_GATE_CONFIG)
    expect(result.pass).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.mode).toBe('warn')
    expect(result.metrics).toEqual(baseMetrics)
  })

  it('fails when coverage is below threshold', () => {
    const result = evaluateGate({ ...baseMetrics, coveragePercent: 50 }, DEFAULT_GATE_CONFIG)
    expect(result.pass).toBe(false)
    expect(result.violations.some((v: { rule: string }) => v.rule === 'coverageThreshold')).toBe(true)
  })

  it('passes on the exact coverage threshold boundary', () => {
    const result = evaluateGate({ ...baseMetrics, coveragePercent: 80 }, DEFAULT_GATE_CONFIG)
    expect(result.pass).toBe(true)
  })

  it('fails when gaps exceed maxGaps', () => {
    const result = evaluateGate({ ...baseMetrics, gapCount: 3 }, { ...DEFAULT_GATE_CONFIG, maxGaps: 0 })
    expect(result.pass).toBe(false)
    expect(result.violations.some((v: { rule: string }) => v.rule === 'maxGaps')).toBe(true)
  })

  it('fails when required types are missing', () => {
    const config = { ...DEFAULT_GATE_CONFIG, requireTypes: ['requirement', 'feature'] }
    const result = evaluateGate({ ...baseMetrics, missingTypes: ['feature'] }, config)
    expect(result.pass).toBe(false)
    expect(result.violations.some((v: { rule: string }) => v.rule === 'requireTypes')).toBe(true)
  })

  it('reflects the configured mode and evaluates a failing verdict', () => {
    const result = evaluateGate(
      { coveragePercent: 0, gapCount: 99, missingTypes: ['feature'] },
      { ...DEFAULT_GATE_CONFIG, mode: 'block' },
    )
    expect(result.mode).toBe('block')
    expect(result.pass).toBe(false)
  })
})

describe('normalizeGateConfig', () => {
  it('falls back to defaults for empty input', () => {
    expect(normalizeGateConfig({})).toEqual(DEFAULT_GATE_CONFIG)
  })

  it('clamps coverage and gaps into range', () => {
    const c = normalizeGateConfig({ coverageThreshold: 200, maxGaps: -5 })
    expect(c.coverageThreshold).toBe(100)
    expect(c.maxGaps).toBe(0)
  })

  it('defaults mode to warn for an invalid mode', () => {
    const c = normalizeGateConfig({ mode: 'explode' as unknown as 'warn' })
    expect(c.mode).toBe('warn')
  })
})
