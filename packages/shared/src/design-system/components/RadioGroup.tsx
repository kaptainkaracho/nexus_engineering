import { cn } from '../utils';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  name: string;
  options: RadioOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  label,
  error,
  disabled,
}: RadioGroupProps<T>) {
  return (
    <fieldset role="radiogroup" aria-label={label} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}>
      {label && (
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          {label}
        </legend>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                selected
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/50'
                  : 'border-border hover:border-primary-300',
                (option.disabled || disabled) && 'cursor-not-allowed opacity-50',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!option.disabled && !disabled) onChange(option.value);
                }
              }}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  selected ? 'border-primary-500' : 'border-border',
                )}
                aria-hidden="true"
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
              </span>
              <div className="flex flex-1 items-start gap-3">
                {option.icon && <span className="shrink-0" aria-hidden="true">{option.icon}</span>}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-text-tertiary">{option.description}</span>
                  )}
                </div>
              </div>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                disabled={option.disabled || disabled}
                className="sr-only"
                role="radio"
                aria-checked={selected}
              />
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-error-500" role="alert">{error}</p>
      )}
    </fieldset>
  );
}
