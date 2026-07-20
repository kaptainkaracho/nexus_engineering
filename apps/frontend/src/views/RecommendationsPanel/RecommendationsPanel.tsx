import { useCallback, useEffect, useState } from 'react';
import { Card, Stack, Container, Button, Badge } from '@nexus-engineering/shared';
import {
  fetchRecommendations,
  fetchCoverageGaps,
  acceptRecommendation,
  dismissRecommendation,
  type Recommendation,
  type RecommendationSeverity,
  type RecommendationCategory,
  type RecommendationStatus,
  type CrossArtifactGap,
} from '../api/client';

const SEVERITY_CONFIG: Record<RecommendationSeverity, { bg: string; text: string; ring: string; dot: string }> = {
  critical: {
    bg: 'bg-error-100 dark:bg-error-950',
    text: 'text-error-700 dark:text-error-300',
    ring: 'ring-error-300 dark:ring-error-800',
    dot: 'bg-error-500 dark:bg-error-400',
  },
  high: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-300 dark:ring-amber-800',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  medium: {
    bg: 'bg-info-100 dark:bg-info-950',
    text: 'text-info-700 dark:text-info-300',
    ring: 'ring-info-300 dark:ring-info-800',
    dot: 'bg-info-500 dark:bg-info-400',
  },
  low: {
    bg: 'bg-surface-tertiary dark:bg-surface-quaternary',
    text: 'text-text-secondary dark:text-text-tertiary',
    ring: 'ring-border dark:ring-border-dark',
    dot: 'bg-text-tertiary dark:bg-text-quaternary',
  },
};

const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  coverage: 'Coverage',
  trace: 'Traceability',
  test: 'Test',
  requirements: 'Requirements',
  architecture: 'Architecture',
};

const CATEGORY_ICON: Record<RecommendationCategory, string> = {
  coverage: '📊',
  trace: '🔗',
  test: '🧪',
  requirements: '📋',
  architecture: '🏗️',
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  dismissed: 'Dismissed',
};

const GAP_COLORS: Record<string, string> = {
  requirement_feature: 'primary',
  requirement_testCase: 'success',
  requirement_architecture: 'info',
  feature_testCase: 'primary',
  feature_architecture: 'info',
  architecture_testCase: 'success',
};

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function formatCategory(cat: RecommendationCategory): string {
  return CATEGORY_LABEL[cat] ?? cat;
}

function formatSeverity(sev: RecommendationSeverity): string {
  return sev.charAt(0).toUpperCase() + sev.slice(1);
}

function formatArtifactType(type: string): string {
  const map: Record<string, string> = {
    requirement: 'Requirement',
    feature: 'Feature',
    testCase: 'Test Case',
    architectureModel: 'Architecture',
    softwareComponent: 'Component',
  };
  return map[type] ?? type;
}

function formatGapType(source: string, target: string): string {
  const key = `${source}_${target}` as keyof typeof GAP_COLORS;
  return `${formatArtifactType(source)} → ${formatArtifactType(target)}`;
}

// Skeleton shimmer bar
function ShimmerBar({ width = 'w-full' }: { width?: string }) {
  return (
    <div
      className={`h-4 ${width} animate-pulse rounded-md bg-surface-tertiary dark:bg-surface-quaternary`}
      role="status"
      aria-label="Loading"
    />
  );
}

function ShimmerCard() {
  return (
    <Card padding="lg" aria-busy="true" aria-label="Loading recommendation card">
      <Stack gap={4}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded-full bg-surface-tertiary dark:bg-surface-quaternary" />
          <ShimmerBar width="w-24" />
          <div className="ml-auto h-5 w-16 animate-pulse rounded-md bg-surface-tertiary dark:bg-surface-quaternary" />
        </div>
        <ShimmerBar />
        <ShimmerBar width="w-3/4" />
        <div className="flex items-center gap-3 pt-1">
          <div className="h-8 w-16 animate-pulse rounded-md bg-surface-tertiary dark:bg-surface-quaternary" />
          <div className="h-8 w-16 animate-pulse rounded-md bg-surface-tertiary dark:bg-surface-quaternary" />
        </div>
      </Stack>
    </Card>
  );
}

// Recommendation Card
function RecommendationCard({
  rec,
  onAccept,
  onDismiss,
}: {
  rec: Recommendation;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const sev = SEVERITY_CONFIG[rec.severity];
  const [actionPending, setActionPending] = useState<string | null>(null);

  const handleAccept = async () => {
    setActionPending('accept');
    try {
      await onAccept(rec.id);
    } finally {
      setActionPending(null);
    }
  };

  const handleDismiss = async () => {
    setActionPending('dismiss');
    try {
      await onDismiss(rec.id);
    } finally {
      setActionPending(null);
    }
  };

  const statusBg: string = rec.status === 'pending'
    ? 'bg-warning-100 text-warning-700 dark:bg-warning-950 dark:text-warning-300'
    : rec.status === 'accepted'
      ? 'bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300'
      : 'bg-surface-tertiary text-text-tertiary dark:bg-surface-quaternary dark:text-text-quaternary';

  return (
    <Card
      padding="lg"
      className="group transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500"
      tabIndex={0}
      role="article"
      aria-label={`Recommendation: ${formatCategory(rec.category)}, severity ${rec.severity}`}
    >
      <Stack gap={4}>
        {/* Header: category + severity + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              {CATEGORY_ICON[rec.category]}
            </span>
            <div>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${sev.bg} ${sev.text} ${sev.ring}`}
              >
                {formatSeverity(rec.severity)}
              </span>
              <span className="ml-2 inline-flex items-center rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary dark:bg-surface-quaternary dark:text-text-tertiary">
                {formatCategory(rec.category)}
              </span>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBg}`}
          >
            {STATUS_LABEL[rec.status]}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              Match Score: {formatScore(rec.matchScore)}
            </p>
            <p className="text-xs text-text-tertiary">
              Confidence: {rec.confidence.charAt(0).toUpperCase() + rec.confidence.slice(1)}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-text-secondary">{rec.description}</p>
        </div>

        {/* Artifacts */}
        <div className="rounded-lg bg-surface-secondary p-3 dark:bg-surface-tertiary">
          <Stack gap={2}>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="text-xs font-medium text-text-tertiary">FROM</span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <div className={`h-2 w-2 rounded-full ${sev.dot}`} aria-hidden="true" />
              <span className="text-sm text-text-primary">
                {formatArtifactType(rec.sourceArtifact.type)}:{' '}
                <span className="font-medium">{rec.sourceArtifact.title}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <svg
                className="h-4 w-4 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <div className="h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-400" aria-hidden="true" />
              <span className="text-sm text-text-primary">
                {formatArtifactType(rec.targetArtifact.type)}:{' '}
                <span className="font-medium">{rec.targetArtifact.title}</span>
              </span>
            </div>
          </Stack>
        </div>

        {/* Actions */}
        {rec.status === 'pending' && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              loading={actionPending === 'accept'}
              disabled={actionPending !== null}
              aria-label="Accept this recommendation"
            >
              <svg
                className="mr-1 h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              loading={actionPending === 'dismiss'}
              disabled={actionPending !== null}
              aria-label="Dismiss this recommendation"
            >
              <svg
                className="mr-1 h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Dismiss
            </Button>
          </div>
        )}
      </Stack>
    </Card>
  );
}

// Gap Visualization Card
function GapCard({ gap }: { gap: CrossArtifactGap }) {
  const gapPercent = gap.gapPercent;
  const coveragePercent = 100 - gapPercent;
  const color = GAP_COLORS[`${gap.sourceType}_${gap.targetType}`] ?? 'warning';
  const barBg = color === 'primary'
    ? 'bg-primary-500 dark:bg-primary-400'
    : color === 'success'
      ? 'bg-success-500 dark:bg-success-400'
      : color === 'info'
        ? 'bg-info-500 dark:bg-info-400'
        : 'bg-warning-500 dark:bg-warning-400';

  return (
    <Card padding="lg" role="region" aria-label={`Gap: ${formatGapType(gap.sourceType, gap.targetType)}`}>
      <Stack gap={4}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {formatGapType(gap.sourceType, gap.targetType)}
          </h3>
          <span className="text-xs font-medium text-text-secondary">
            {coveragePercent}% covered
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-surface-quaternary">
          <div
            className={`h-full rounded-full ${barBg} transition-all duration-500`}
            style={{ width: `${coveragePercent}%` }}
            role="progressbar"
            aria-valuenow={coveragePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${coveragePercent}% coverage`}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-secondary p-2 dark:bg-surface-tertiary">
            <p className="text-xs text-text-tertiary">Total Pairs</p>
            <p className="text-base font-bold text-text-primary">{gap.totalPairs}</p>
          </div>
          <div className="rounded-lg bg-success-50 p-2 dark:bg-success-950">
            <p className="text-xs text-text-tertiary">Covered</p>
            <p className="text-base font-bold text-success-600 dark:text-success-400">
              {gap.coveredPairs}
            </p>
          </div>
          <div className="rounded-lg bg-error-50 p-2 dark:bg-error-950">
            <p className="text-xs text-text-tertiary">Gap</p>
            <p className="text-base font-bold text-error-600 dark:text-error-400">
              {gap.totalPairs - gap.coveredPairs}
            </p>
          </div>
        </div>

        {/* Sample gaps */}
        {gap.sampleGaps.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
              View {gap.sampleGaps.length} sample gap(s)
            </summary>
            <ul className="mt-2 space-y-1" role="list">
              {gap.sampleGaps.map((sample, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-surface-secondary px-2 py-1 text-xs text-text-secondary dark:bg-surface-tertiary"
                >
                  <span className="font-medium text-text-tertiary">{sample.sourceId.slice(0, 8)}…</span>
                  <span>→</span>
                  <span className="font-medium text-text-tertiary">{sample.targetId.slice(0, 8)}…</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Stack>
    </Card>
  );
}

// Empty state
function EmptyState({ title, message, actionLabel, onAction }: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card padding="xl" className="text-center">
      <Stack gap={4} align="center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary dark:bg-surface-tertiary">
          <svg
            className="h-8 w-8 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{message}</p>
        </div>
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// Error state
function ErrorState({ message, retryLabel, onRetry }: {
  message: string;
  retryLabel?: string;
  onRetry: () => void;
}) {
  return (
    <Card padding="lg" className="border-l-4 border-l-error-500">
      <Stack gap={3}>
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span className="text-sm font-medium text-error-700 dark:text-error-300">
            {message}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel ?? 'Retry'}
        </Button>
      </Stack>
    </Card>
  );
}

// Filter chips
type FilterCategory = RecommendationCategory | 'all';
type FilterSeverity = RecommendationSeverity | 'all';

function FilterChips({
  categories,
  severities,
  activeCategory,
  activeSeverity,
  counts,
  onCategoryChange,
  onSeverityChange,
}: {
  categories: { value: FilterCategory; label: string; icon: string }[];
  severities: { value: FilterSeverity; label: string; color: string }[];
  activeCategory: FilterCategory;
  activeSeverity: FilterSeverity;
  counts: { category: number; severity: number };
  onCategoryChange: (cat: FilterCategory) => void;
  onSeverityChange: (sev: FilterSeverity) => void;
}) {
  const chipBase =
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer select-none border border-transparent';
  const chipActive = 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950 dark:text-primary-300';
  const chipInactive = 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary dark:bg-surface-tertiary dark:text-text-tertiary dark:hover:bg-surface-quaternary';

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filters">
      <div className="flex items-center gap-1" role="group" aria-label="Category filter">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`${chipBase} ${activeCategory === cat.value ? chipActive : chipInactive}`}
            onClick={() => onCategoryChange(cat.value)}
            aria-pressed={activeCategory === cat.value}
          >
            <span aria-hidden="true">{cat.icon}</span>
            {cat.label}
            {counts.category > 0 && (
              <Badge size="xs">{counts.category}</Badge>
            )}
          </button>
        ))}
      </div>
      <div className="h-4 w-px bg-border" aria-hidden="true" />
      <div className="flex items-center gap-1" role="group" aria-label="Severity filter">
        {severities.map((sev) => (
          <button
            key={sev.value}
            type="button"
            className={`${chipBase} ${activeSeverity === sev.value ? chipActive : chipInactive}`}
            onClick={() => onSeverityChange(sev.value)}
            aria-pressed={activeSeverity === sev.value}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${sev.color}`} aria-hidden="true" />
            {sev.label}
            {counts.severity > 0 && (
              <Badge size="xs">{counts.severity}</Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Summary stats
function SummaryStats({
  recommendations,
  gaps,
}: {
  recommendations: Recommendation[];
  gaps: CrossArtifactGap[];
}) {
  const total = recommendations.length;
  const pending = recommendations.filter((r) => r.status === 'pending').length;
  const accepted = recommendations.filter((r) => r.status === 'accepted').length;
  const highRisk = recommendations.filter((r) => r.severity === 'critical' || r.severity === 'high').length;
  const avgScore = total > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / total * 100)
    : 0;
  const totalGaps = gaps.length;
  const avgGap = totalGaps > 0
    ? Math.round(gaps.reduce((sum, g) => sum + g.gapPercent, 0) / totalGaps)
    : 0;

  const stats = [
    { label: 'Total', value: total, icon: '📊', color: 'text-text-primary' },
    { label: 'Pending', value: pending, icon: '⏳', color: 'text-warning-600 dark:text-warning-400' },
    { label: 'Accepted', value: accepted, icon: '✅', color: 'text-success-600 dark:text-success-400' },
    { label: 'High Risk', value: highRisk, icon: '⚠️', color: 'text-error-600 dark:text-error-400' },
    { label: 'Avg Score', value: `${avgScore}%`, icon: '🎯', color: 'text-primary-600 dark:text-primary-400' },
    { label: 'Gaps', value: totalGaps, icon: '🔍', color: 'text-info-600 dark:text-info-400' },
    { label: 'Avg Gap', value: `${avgGap}%`, icon: '📉', color: 'text-warning-600 dark:text-warning-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-xl bg-surface-secondary p-4 text-center dark:bg-surface-tertiary"
        >
          <span className="text-xl" aria-hidden="true">{stat.icon}</span>
          <span className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</span>
          <span className="text-xs text-text-tertiary">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [gaps, setGaps] = useState<CrossArtifactGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeSeverity, setActiveSeverity] = useState<FilterSeverity>('all');
  const [selectedRec, setSelectedRec] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recs, gapData] = await Promise.all([
        fetchRecommendations('all'),
        fetchCoverageGaps(),
      ]);
      setRecommendations(recs);
      setGaps(gapData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = useCallback(async (id: string) => {
    try {
      await acceptRecommendation(id);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'accepted' as RecommendationStatus } : r)),
      );
    } catch {
      setError('Failed to accept recommendation');
    }
  }, []);

  const handleDismiss = useCallback(async (id: string) => {
    try {
      await dismissRecommendation(id);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' as RecommendationStatus } : r)),
      );
    } catch {
      setError('Failed to dismiss recommendation');
    }
  }, []);

  const handleRefresh = useCallback(() => {
    load();
  }, [load]);

  // Filter recommendations
  const filtered = recommendations.filter((r) => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    if (activeSeverity !== 'all' && r.severity !== activeSeverity) return false;
    return true;
  });

  // Counts for badges
  const categoryCounts = Object.entries(CATEGORY_LABEL).reduce<Record<string, number>>((acc, [key, label]) => {
    acc[key] = recommendations.filter((r) => r.category === key).length;
    return acc;
  }, {} as Record<string, number>);
  const severityCounts = Object.entries(SEVERITY_CONFIG).reduce<Record<string, number>>((acc, [key]) => {
    acc[key] = recommendations.filter((r) => r.severity === key).length;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { value: 'all' as FilterCategory, label: 'All', icon: '📋' },
    ...Object.entries(CATEGORY_LABEL).map(([key, label]) => ({
      value: key as FilterCategory,
      label,
      icon: CATEGORY_ICON[key as RecommendationCategory],
    })),
  ];

  const severities = [
    { value: 'all' as FilterSeverity, label: 'All', color: 'bg-text-tertiary dark:bg-text-quaternary' },
    ...Object.entries(SEVERITY_CONFIG).map(([key, config]) => ({
      value: key as FilterSeverity,
      label: formatSeverity(key as RecommendationSeverity),
      color: config.dot,
    })),
  ];

  return (
    <Container size="lg">
      <Stack gap={6}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Recommendations</h2>
            <p className="text-sm text-text-secondary">
              AI-suggested trace links and coverage gaps
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        {!loading && !error && (
          <SummaryStats recommendations={recommendations} gaps={gaps} />
        )}

        {/* Filter Chips */}
        {!loading && !error && (
          <FilterChips
            categories={categories}
            severities={severities}
            activeCategory={activeCategory}
            activeSeverity={activeSeverity}
            counts={{
              category: activeCategory !== 'all' ? categoryCounts[activeCategory] ?? 0 : 0,
              severity: activeSeverity !== 'all' ? severityCounts[activeSeverity] ?? 0 : 0,
            }}
            onCategoryChange={setActiveCategory}
            onSeverityChange={setActiveSeverity}
          />
        )}

        {/* Content */}
        {loading && (
          <Stack gap={4}>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </Stack>
        )}

        {error && <ErrorState message={error} onRetry={handleRefresh} />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="No recommendations found"
            message={
              activeCategory !== 'all' || activeSeverity !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Run AI trace analysis to generate recommendations.'
            }
            actionLabel={
              activeCategory !== 'all' || activeSeverity !== 'all'
                ? 'Clear Filters'
                : 'Run Analysis'
            }
            onAction={
              activeCategory !== 'all' || activeSeverity !== 'all'
                ? () => { setActiveCategory('all'); setActiveSeverity('all'); }
                : undefined
            }
          />
        )}

        {/* Recommendations List */}
        {!loading && !error && filtered.length > 0 && (
          <Stack gap={4}>
            <p className="text-sm text-text-tertiary">
              Showing {filtered.length} of {recommendations.length} recommendation(s)
            </p>
            {filtered.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
              />
            ))}
          </Stack>
        )}

        {/* Gaps Section */}
        {!loading && !error && gaps.length > 0 && (
          <>
            <div className="pt-4">
              <h3 className="text-lg font-bold text-text-primary">Coverage Gaps</h3>
              <p className="text-sm text-text-secondary">
                Missing links between artifact types
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {gaps.map((gap, i) => (
                <GapCard key={i} gap={gap} />
              ))}
            </div>
          </>
        )}

        {!loading && !error && gaps.length === 0 && (
          <div>
            <h3 className="text-lg font-bold text-text-primary">Coverage Gaps</h3>
            <EmptyState
              title="No gaps detected"
              message="All artifact types have sufficient traceability coverage."
            />
          </div>
        )}
      </Stack>
    </Container>
  );
}

export default RecommendationsPanel;
