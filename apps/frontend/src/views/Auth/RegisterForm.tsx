import { useState } from 'react';
import { Button, Input, Stack } from '@nexus-engineering/shared';
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
          <div
            className="rounded-lg border border-error-500/40 bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950 dark:text-error-300"
            role="alert"
          >
            {serverError}
          </div>
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
          type="password"
          placeholder="Create a password"
          value={form.password}
          onChange={handleChange('password')}
          error={errors.password}
          helperText="At least 8 characters"
          leftIcon={<LockIcon />}
          fullWidth
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          leftIcon={<LockIcon />}
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
