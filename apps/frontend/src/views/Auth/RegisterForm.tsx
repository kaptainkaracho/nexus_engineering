import { useState, useMemo } from 'react';
import { Alert, Button, Input, Stack } from '@nexus-engineering/shared';
import { register, type RegisterRequest } from '../../api/auth';

export interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  );
}

interface FormState extends RegisterRequest {
  confirmPassword: string;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    const { password } = form;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }, [form.password]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-error-500', 'bg-warning-500', 'bg-info-500', 'bg-success-500'];

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    if (!form.email) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      next.password = 'Password is required';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      next.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (serverError) setServerError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      });
      onSuccess();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={5}>
        {serverError && (
          <Alert variant="error">
            {serverError}
          </Alert>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange('name')}
          error={errors.name}
          leftIcon={<UserIcon />}
          fullWidth
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
          leftIcon={<MailIcon />}
          fullWidth
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          value={form.password}
          onChange={handleChange('password')}
          error={errors.password}
          leftIcon={<LockIcon />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="pointer-events-auto text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
          fullWidth
          autoComplete="new-password"
        />

        {form.password.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((segment) => (
                <div
                  key={segment}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                    segment <= passwordStrength ? strengthColors[passwordStrength] : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-text-tertiary">
              {strengthLabel[passwordStrength]}{passwordStrength > 0 ? ' password' : ''}
            </p>
          </div>
        )}

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          leftIcon={<LockIcon />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="pointer-events-auto text-text-tertiary hover:text-text-secondary transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
          fullWidth
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Create Account
        </Button>

        <p className="text-center text-sm text-text-tertiary">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign in
          </button>
        </p>
      </Stack>
    </form>
  );
}
