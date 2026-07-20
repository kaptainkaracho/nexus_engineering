import { cn } from '../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'h-10 w-full rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary',
            'placeholder:text-text-tertiary transition-colors duration-200',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:text-text-tertiary',
            error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : undefined,
            leftIcon ? 'pl-10' : undefined,
            rightIcon ? 'pr-10' : undefined,
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-error-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
}
