import { useId } from 'react';
import type { ExecutionStatus } from '../../api/client';

// Token references: --color-success-500, --color-error-500, --color-warning-500, --color-neutral-400
export const STATUS_COLORS: Record<ExecutionStatus, string> = {
  passed: '#22C55E',   // success-500
  failed: '#EF4444',   // error-500
  error: '#F97316',    // warning-400 (orange — no exact token, closest match)
  skipped: '#94A3B8',  // neutral-400
  flaky: '#8B5CF6',    // accent (violet — no token, kept as-is)
};

export const STATUS_LABELS: Record<ExecutionStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  error: 'Error',
  skipped: 'Skipped',
  flaky: 'Flaky',
};

interface DistributionProps {
  counts: Record<ExecutionStatus, number>;
  total: number;
}

/** Accessible stacked bar showing the overall status distribution. */
export function StatusDistribution({ counts, total }: DistributionProps) {
  const order: ExecutionStatus[] = ['passed', 'failed', 'error', 'skipped', 'flaky'];
  const segments = order.filter((s) => counts[s] > 0);
  const summary = order
    .map((s) => `${counts[s]} ${STATUS_LABELS[s].toLowerCase()}`)
    .join(', ');

  return (
    <figure className="m-0" role="img" aria-label={`Status distribution: ${summary}`}>
      <div
        className="ter-distribution-bar"
        role="presentation"
        style={{ display: 'flex', height: '14px', borderRadius: '9999px', overflow: 'hidden' }}
      >
        {segments.map((s) => (
          <div
            key={s}
            style={{
              width: `${(counts[s] / total) * 100}%`,
              backgroundColor: STATUS_COLORS[s],
            }}
            title={`${STATUS_LABELS[s]}: ${counts[s]}`}
          />
        ))}
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

interface TrendPoint {
  label: string;
  passRate: number;
  total: number;
}

interface TrendProps {
  points: TrendPoint[];
}

/** SVG line chart of daily pass-rate trend. Conveys data via aria-label and a hidden table. */
export function PassRateTrend({ points }: TrendProps) {
  const gradId = useId();
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const maxRate = 100;
  const x = (i: number) =>
    padX + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (rate: number) => padY + plotH - (rate / maxRate) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.passRate).toFixed(1)}`)
    .join(' ');
  const areaPath = points.length
    ? `${linePath} L ${x(points.length - 1).toFixed(1)} ${(padY + plotH).toFixed(1)} L ${x(0).toFixed(1)} ${(padY + plotH).toFixed(1)} Z`
    : '';

  const summary = points
    .map((p) => `${p.label}: ${p.passRate}% pass rate across ${p.total} runs`)
    .join('; ');

  return (
    <figure className="m-0" role="img" aria-label={`Pass rate trend. ${summary}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxHeight: '260px' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.passed} stopOpacity="0.25" />
            <stop offset="100%" stopColor={STATUS_COLORS.passed} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-neutral-200)"
              strokeWidth="1"
              strokeDasharray={tick === 0 ? undefined : '3 4'}
            />
            <text x={padX - 8} y={y(tick) + 4} textAnchor="end" className="ter-axis-label">
              {tick}%
            </text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke={STATUS_COLORS.passed} strokeWidth="2.5" />
        )}
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.passRate)} r="3.5" fill={STATUS_COLORS.passed} />
            <text x={x(i)} y={height - 6} textAnchor="middle" className="ter-axis-label">
              {p.label}
            </text>
          </g>
        ))}
        {points.length === 1 && (
          <text x={x(0)} y={y(points[0].passRate) - 10} textAnchor="middle" className="ter-axis-value">
            {points[0].passRate}%
          </text>
        )}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

interface SuiteCoverageProps {
  suites: Array<{ suiteId: string; passRate: number; passed: number; total: number }>;
}

/** Horizontal coverage bars per test suite. */
export function SuiteCoverage({ suites }: SuiteCoverageProps) {
  return (
    <ul className="m-0 list-none p-0" style={{ display: 'grid', gap: '0.75rem' }}>
      {suites.map((s) => (
        <li key={s.suiteId}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-text-primary" title={s.suiteId}>
              {s.suiteId}
            </span>
            <span className="shrink-0 tabular-nums text-text-secondary">
              {s.passRate}% · {s.passed}/{s.total}
            </span>
          </div>
          <div
            className="ter-bar-track"
            role="img"
            aria-label={`${s.suiteId}: ${s.passRate}% pass rate, ${s.passed} of ${s.total} passing`}
          >
            <div
              className="ter-bar-fill"
              style={{
                width: `${s.passRate}%`,
                backgroundColor:
                  s.passRate >= 90
                    ? STATUS_COLORS.passed
                    : s.passRate >= 70
                      ? STATUS_COLORS.flaky
                      : STATUS_COLORS.failed,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
