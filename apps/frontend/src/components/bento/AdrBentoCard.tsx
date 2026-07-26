import { Card, Badge, Stack, cn } from '@nexus-engineering/shared';

export interface AdrBentoCardProps {
  number: string;
  title: string;
  status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  date: string;
  deciders: string[];
  issue: string;
  pros?: string[];
  cons?: string[];
  variant?: 'main' | 'side';
  className?: string;
}

const STATUS_BADGE_MAP: Record<string, string> = {
  Proposed: 'proposed',
  Accepted: 'approved',
  Deprecated: 'rejected',
  Superseded: 'conflictsWith',
};

const STATUS_DOT_MAP: Record<string, string> = {
  Proposed: 'bg-info-500',
  Accepted: 'bg-success-500',
  Deprecated: 'bg-error-500',
  Superseded: 'bg-warning-500',
};

export function AdrBentoCard({
  number,
  title,
  status,
  date,
  deciders,
  issue,
  pros = [],
  cons = [],
  variant = 'main',
  className,
}: AdrBentoCardProps) {
  const isMain = variant === 'main';

  return (
    <Card
      variant="outlined"
      padding={isMain ? 'lg' : 'md'}
      className={cn(
        'h-full transition-all duration-200 hover:shadow-md',
        isMain && 'border-l-4 border-l-primary-500',
        className,
      )}
    >
      <Stack gap={isMain ? 4 : 3}>
        {/* Header: ID + Status + Date */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-mono font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              ADR-{number}
            </span>
            <Badge variant={STATUS_BADGE_MAP[status] || 'info'}>{status}</Badge>
            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_MAP[status])} />
          </div>
          <span className="text-xs text-text-tertiary">{date}</span>
        </div>

        {/* Title */}
        <h3 className={cn('font-semibold text-text-primary', isMain ? 'text-lg' : 'text-base')}>
          {title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
          <span>
            <span className="font-medium text-text-secondary">Deciders:</span>{' '}
            {deciders.join(', ')}
          </span>
          <span>
            <span className="font-medium text-text-secondary">Issue:</span>{' '}
            <span className="font-mono text-primary-600">{issue}</span>
          </span>
        </div>

        {/* Pro/Con — main card only */}
        {isMain && (pros.length > 0 || cons.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mt-1">
            {pros.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-success-600 dark:text-success-400">
                  Pros
                </p>
                <ul className="space-y-1">
                  {pros.map((item, i) => (
                    <li key={i} className="flex gap-1.5 text-sm text-text-secondary">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-success-100 text-center text-[10px] font-bold text-success-700 dark:bg-success-950 dark:text-success-300">
                        +
                      </span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-error-600 dark:text-error-400">
                  Cons
                </p>
                <ul className="space-y-1">
                  {cons.map((item, i) => (
                    <li key={i} className="flex gap-1.5 text-sm text-text-secondary">
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-error-100 text-center text-[10px] font-bold text-error-700 dark:bg-error-950 dark:text-error-300">
                        −
                      </span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Side card: compact link/reference */}
        {!isMain && (
          <div className="mt-1 rounded-lg bg-surface-secondary p-3">
            <p className="text-xs text-text-tertiary">
              <span className="font-medium text-text-secondary">Status:</span>{' '}
              {status === 'Accepted' ? 'Approved for implementation' : `Awaiting review`}
            </p>
          </div>
        )}
      </Stack>
    </Card>
  );
}
