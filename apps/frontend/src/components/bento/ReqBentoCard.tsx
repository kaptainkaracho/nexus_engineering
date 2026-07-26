import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Stack, cn } from '@nexus-engineering/shared';
import { ChevronDown } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = isFeatured && acceptanceCriteria.length > 0;

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

        {/* Expand/collapse toggle */}
        {hasExpandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors -mt-1"
            aria-expanded={expanded}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
            {expanded ? 'Hide criteria' : `Show acceptance criteria (${acceptanceCriteria.length})`}
          </button>
        )}

        {/* Acceptance Criteria — animated expand/collapse */}
        <AnimatePresence initial={false}>
          {expanded && hasExpandable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-1">
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
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    </Card>
  );
}
