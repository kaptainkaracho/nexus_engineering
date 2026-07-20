import { Badge } from '@nexus-engineering/shared';
import type { GateMode } from '@nexus-engineering/shared';

interface GateStatusBadgeProps {
  pass: boolean;
  mode: GateMode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GateStatusBadge({ pass, mode, size = 'md', className = '' }: GateStatusBadgeProps) {
  const variant = pass ? 'success' : 'critical';
  const label = pass
    ? mode === 'block'
      ? 'PASS'
      : 'PASS (warn)'
    : mode === 'block'
      ? 'FAIL'
      : 'FAIL (warn)';
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${
        variant === 'success'
          ? 'bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300'
          : 'bg-error-100 text-error-700 dark:bg-error-950 dark:text-error-300'
      } ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Gate ${label}`}
    >
      {label}
    </span>
  );
}
