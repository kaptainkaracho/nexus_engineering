import { cn } from '../utils';

export type BadgeVariant =
  | 'high' | 'critical' | 'medium' | 'low'
  | 'approved' | 'implemented' | 'verified' | 'proposed' | 'rejected'
  | 'completed' | 'draft' | 'ready' | 'automated' | 'manual' | 'partially-automated'
  | 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' | 'refines' | 'conflictsWith'
  | 'block' | 'part' | 'port' | 'unit' | 'info';

interface PaletteEntry { light: string; dark: string }

const PALETTE: Record<BadgeVariant, PaletteEntry> = {
  high:             { light: 'warning-500/10',          dark: 'warning-950 text-warning-300' },
  critical:         { light: 'error-500/10',            dark: 'error-950 text-error-300' },
  medium:           { light: 'neutral-500/10',          dark: 'neutral-950 text-neutral-300' },
  low:              { light: 'neutral-500/10',          dark: 'neutral-950 text-neutral-400' },
  approved:         { light: 'success-500/10',          dark: 'success-950 text-success-300' },
  implemented:      { light: 'primary-500/10',          dark: 'primary-950 text-primary-300' },
  verified:         { light: 'primary-500/10',          dark: 'primary-950 text-primary-300' },
  proposed:         { light: 'secondary-500/10',        dark: 'secondary-950 text-secondary-300' },
  rejected:         { light: 'error-500/10',            dark: 'error-950 text-error-300' },
  completed:        { light: 'success-500/10',          dark: 'success-950 text-success-300' },
  draft:            { light: 'neutral-500/10',          dark: 'neutral-950 text-neutral-400' },
  ready:            { light: 'information-500/10',      dark: '' },
  automated:        { light: 'primary-500/10',          dark: 'primary-950 text-primary-300' },
  manual:           { light: 'neutral-500/10',          dark: 'neutral-950 text-neutral-400' },
  'partially-automated': { light: 'warning-500/10',     dark: 'warning-950 text-warning-300' },
  satisfies:        { light: 'success-500/10',          dark: 'success-950 text-success-300' },
  verifies:         { light: 'error-500/10',            dark: 'error-950 text-error-300' },
  tracesTo:         { light: 'info-500/10',             dark: '' },
  dependsOn:        { light: 'warning-500/10',          dark: 'warning-950 text-warning-300' },
  refines:          { light: 'secondary-500/10',        dark: 'secondary-950 text-secondary-300' },
  conflictsWith:    { light: 'error-500/10',            dark: 'error-950 text-error-300' },
  block:            { light: 'info-500/10',             dark: '' },
  part:             { light: 'information-500/10',      dark: '' },
  port:             { light: 'information-500/10',      dark: '' },
  unit:             { light: 'success-500/10',          dark: 'success-950 text-success-300' },
  info:             { light: 'info-500/10',             dark: '' },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: string;
  children: React.ReactNode;
}

export function Badge({ variant, className, children, ...rest }: BadgeProps) {
  const base = 'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const entry = PALETTE[variant as BadgeVariant];
  const isKnown = !!entry;

  return (
    <span
      className={cn(
        base,
        isKnown ? `bg-${entry.light} ${entry.dark}` : 'bg-neutral-400/10 text-neutral-600',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
