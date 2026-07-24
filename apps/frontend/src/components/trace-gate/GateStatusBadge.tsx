import { Badge } from '@nexus-engineering/shared';
import type { GateMode } from '@nexus-engineering/shared';

interface GateStatusBadgeProps {
  pass: boolean;
  mode: GateMode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GateStatusBadge({ pass, mode, size = 'md', className = '' }: GateStatusBadgeProps) {
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
  const variant = pass ? 'approved' : 'critical';

  return (
    <Badge
      variant={variant}
      className={`inline-flex items-center font-semibold ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Gate ${label}`}
    >
      {label}
    </Badge>
  );
}
