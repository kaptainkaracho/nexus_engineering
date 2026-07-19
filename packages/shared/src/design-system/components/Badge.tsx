import { cn } from '../utils';

export type BadgeVariant =
  | 'high' | 'critical' | 'medium' | 'low'
  | 'approved' | 'implemented' | 'verified' | 'proposed' | 'rejected'
  | 'completed' | 'draft' | 'ready' | 'automated' | 'manual' | 'partially-automated'
  | 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' | 'refines' | 'conflictsWith'
  | 'block' | 'part' | 'port' | 'unit' | 'info'
  | 'integration' | 'e2e' | 'performance' | 'security' | 'usability';

interface PaletteEntry { light: string; dark: string }

const PALETTE: Record<BadgeVariant, PaletteEntry> = {
  high:             { light: 'warning-500/10',          dark: 'dark:bg-warning-950 dark:text-warning-300' },
  critical:         { light: 'error-500/10',            dark: 'dark:bg-error-950 dark:text-error-300' },
  medium:           { light: 'neutral-500/10',          dark: 'dark:bg-neutral-950 dark:text-neutral-300' },
  low:              { light: 'neutral-500/10',          dark: 'dark:bg-neutral-950 dark:text-neutral-400' },
  approved:         { light: 'success-500/10',          dark: 'dark:bg-success-950 dark:text-success-300' },
  implemented:      { light: 'primary-500/10',          dark: 'dark:bg-primary-950 dark:text-primary-300' },
  verified:         { light: 'primary-500/10',          dark: 'dark:bg-primary-950 dark:text-primary-300' },
  proposed:         { light: 'secondary-500/10',        dark: 'dark:bg-secondary-950 dark:text-secondary-300' },
  rejected:         { light: 'error-500/10',            dark: 'dark:bg-error-950 dark:text-error-300' },
  completed:        { light: 'success-500/10',          dark: 'dark:bg-success-950 dark:text-success-300' },
  draft:            { light: 'neutral-500/10',          dark: 'dark:bg-neutral-950 dark:text-neutral-400' },
  ready:            { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  automated:        { light: 'primary-500/10',          dark: 'dark:bg-primary-950 dark:text-primary-300' },
  manual:           { light: 'neutral-500/10',          dark: 'dark:bg-neutral-950 dark:text-neutral-400' },
  'partially-automated': { light: 'warning-500/10',     dark: 'dark:bg-warning-950 dark:text-warning-300' },
  satisfies:        { light: 'success-500/10',          dark: 'dark:bg-success-950 dark:text-success-300' },
  verifies:         { light: 'error-500/10',            dark: 'dark:bg-error-950 dark:text-error-300' },
  tracesTo:         { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  dependsOn:        { light: 'warning-500/10',          dark: 'dark:bg-warning-950 dark:text-warning-300' },
  refines:          { light: 'secondary-500/10',        dark: 'dark:bg-secondary-950 dark:text-secondary-300' },
  conflictsWith:    { light: 'error-500/10',            dark: 'dark:bg-error-950 dark:text-error-300' },
  block:            { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  part:             { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  port:             { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  unit:             { light: 'success-500/10',          dark: 'dark:bg-success-950 dark:text-success-300' },
  info:             { light: 'info-500/10',             dark: 'dark:bg-info-950 dark:text-info-300' },
  integration:      { light: 'secondary-500/10',        dark: 'dark:bg-secondary-950 dark:text-secondary-300' },
  e2e:              { light: 'primary-500/10',          dark: 'dark:bg-primary-950 dark:text-primary-300' },
  performance:      { light: 'warning-500/10',          dark: 'dark:bg-warning-950 dark:text-warning-300' },
  security:         { light: 'error-500/10',            dark: 'dark:bg-error-950 dark:text-error-300' },
  usability:        { light: 'success-500/10',          dark: 'dark:bg-success-950 dark:text-success-300' },
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
