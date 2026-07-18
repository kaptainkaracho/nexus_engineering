import { cn } from '../utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  success:
    'bg-success-50 border-success-200 text-success-700 dark:bg-success-950 dark:text-success-300',
  error:
    'bg-error-50 border-error-200 text-error-700 dark:bg-error-950 dark:text-error-300',
  warning:
    'bg-warning-50 border-warning-200 text-warning-700 dark:bg-warning-950 dark:text-warning-300',
  info:
    'bg-info-50 border-info-200 text-info-700 dark:bg-info-950 dark:text-info-300',
};

const iconColors: Record<AlertVariant, string> = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-info-500',
};

export function Alert({
  variant,
  title,
  children,
  icon,
  dismissible,
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        variantStyles[variant],
        className,
      )}
      role="alert"
    >
      {icon && (
        <div className={cn('mt-0.5 shrink-0', iconColors[variant])} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="flex-1">
        {title && (
          <p className="text-sm font-semibold">{title}</p>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'shrink-0 rounded-lg p-1 transition-colors',
            'hover:bg-black/5 dark:hover:bg-white/10',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
          )}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
