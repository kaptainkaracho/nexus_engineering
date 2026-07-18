import { cn } from '../utils';

export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
  className?: string;
  role?: string;
  'aria-label'?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface-primary border border-border',
  elevated: 'bg-surface-primary shadow-lg',
  outlined: 'bg-transparent border border-border',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  role,
  'aria-label': ariaLabel,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-shadow duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        className,
      )}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
