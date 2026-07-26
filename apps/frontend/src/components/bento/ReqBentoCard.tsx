import { Card, Badge, Stack, cn } from '@nexus-engineering/shared';

export type ReqPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReqStatus = 'proposed' | 'approved' | 'rejected' | 'implemented' | 'verified';

export interface ReqBentoCardProps {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: ReqPriority;
  status: ReqStatus;
  tags?: string[];
  acceptanceCriteria?: string[];
  className?: string;
}

const PRIORITY_SIZE_MAP: Record<ReqPriority, 'featured' | 'standard' | 'compact'> = {
  critical: 'featured',
  high: 'featured',
  medium: 'standard',
  low: 'compact',
};

const PRIORITY_BADGE_MAP: Record<ReqPriority, string> = {
  critical: 'rejected',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const STATUS_BADGE_MAP: Record<ReqStatus, string> = {
  proposed: 'proposed',
  approved: 'approved',
  rejected: 'rejected',
  implemented: 'tracesTo',
  verified: 'verified',
};

const PRIORITY_BORDER_MAP: Record<ReqPriority, string> = {
  critical: 'border-l-error-500',
  high: 'border-l-warning-500',
  medium: 'border-l-primary-500',
  low: 'border-l-neutral-300 dark:border-l-neutral-600',
};

export function ReqBentoCard({
  id,
  type,
  title,
  description,
  priority,
  status,
  tags = [],
  acceptanceCriteria = [],
  className,
}: ReqBentoCardProps) {
  const size = PRIORITY_SIZE_MAP[priority];
  const isFeatured = size === 'featured';

  return (
    <Card
      variant="outlined"
      padding={isFeatured ? 'lg' : 'md'}
      className={cn(
        'h-full border-l-4 transition-all duration-200 hover:shadow-md',
        PRIORITY_BORDER_MAP[priority],
        isFeatured && 'bento-req-featured',
        className,
      )}
    >
      <Stack gap={isFeatured ? 4 : 3}>
        {/* Header: ID + Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-primary-50 px-1.5 py-0.5 text-xs font-mono font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            {id}
          </span>
          <Badge variant="info">{type}</Badge>
          <Badge variant={PRIORITY_BADGE_MAP[priority]}>{priority}</Badge>
          <Badge variant={STATUS_BADGE_MAP[status]}>{status}</Badge>
        </div>

        {/* Title */}
        <h3 className={cn('font-semibold text-text-primary', isFeatured ? 'text-lg' : 'text-base')}>
          {title}
        </h3>

        {/* Description */}
        <p className={cn('text-text-secondary leading-relaxed', isFeatured ? 'text-sm' : 'text-sm line-clamp-2')}>
          {description}
        </p>

        {/* Tags */}
        {isFeatured && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Acceptance Criteria — featured only */}
        {isFeatured && acceptanceCriteria.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Acceptance Criteria
            </p>
            <ul className="space-y-1">
              {acceptanceCriteria.map((ac, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-success-100 text-center text-[10px] font-bold text-success-700 dark:bg-success-950 dark:text-success-300">
                    ✓
                  </span>
                  {ac}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Stack>
    </Card>
  );
}
