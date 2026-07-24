import { useId, useState } from 'react';
import {
  computeAdjustedSuccessRate,
  type ProcessMiningKPI,
} from './processMining';

interface SuccessRateKPIProps {
  /** KPI data from Minerva or aggregateRuns() */
  kpi: ProcessMiningKPI;
  /** Optional className for the outer wrapper */
  className?: string;
}

function rateColor(rate: number): string {
  if (rate >= 80) return 'var(--color-success-600)';
  if (rate >= 60) return 'var(--color-warning-500)';
  return 'var(--color-error-600)';
}

/** Displays the adjusted success rate as the primary value,
 *  with the raw rate and a tooltip explaining the adjustment. */
export function SuccessRateKPI({ kpi, className }: SuccessRateKPIProps) {
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(false);
  const adjusted = computeAdjustedSuccessRate(kpi);

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
    >
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Success Rate
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: rateColor(adjusted.adjustedRate) }}
        >
          {adjusted.adjustedRate}%
        </span>
        <span
          className="text-sm tabular-nums"
          style={{ color: 'var(--color-text-tertiary)', textDecoration: 'line-through' }}
          title={`Raw rate: ${adjusted.rawRate}%`}
        >
          Raw: {adjusted.rawRate}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <button
          type="button"
          id={tooltipId}
          aria-describedby={showTooltip ? `${tooltipId}-tip` : undefined}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '9999px',
            width: '1rem',
            height: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'help',
            fontSize: '0.625rem',
            fontWeight: 600,
            color: 'var(--color-text-tertiary)',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ?
        </button>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {adjusted.terminalRuns} terminal runs
          {adjusted.inFlightExcluded > 0 && (
            <> · {adjusted.inFlightExcluded} in-flight excluded</>
          )}
        </span>
      </div>
      {showTooltip && (
        <div
          id={`${tooltipId}-tip`}
          role="tooltip"
          style={{
            position: 'absolute',
            marginTop: '2rem',
            maxWidth: '20rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            background: 'var(--color-surface-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            zIndex: 50,
            lineHeight: 1.4,
          }}
        >
          Adjusted rate excludes in-flight runs from denominator.
          Formula: succeeded / (succeeded + failed).
          Raw rate includes {adjusted.inFlightExcluded} running/pending runs in the
          denominator, which understates the true terminal success rate.
        </div>
      )}
    </div>
  );
}
