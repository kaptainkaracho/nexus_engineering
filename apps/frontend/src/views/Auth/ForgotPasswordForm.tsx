import { useState } from 'react';
import { Button, Input, Stack } from '@nexus-engineering/shared';
import { forgotPassword } from '../../api/auth';

export interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Request failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Stack gap={5} align="center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-950">
          <svg className="h-8 w-8 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Stack gap={2} align="center">
          <h3 className="text-lg font-semibold text-text-primary">Check your email</h3>
          <p className="text-center text-sm text-text-tertiary">
            We&apos;ve sent a password reset link to <strong className="text-text-secondary">{email}</strong>.
            Click the link in the email to reset your password.
          </p>
        </Stack>
        <Button variant="ghost" size="sm" onClick={onBackToLogin}>
          Back to Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={5}>
        <Stack gap={2}>
          <h3 className="text-lg font-semibold text-text-primary">Forgot password?</h3>
          <p className="text-sm text-text-tertiary">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </Stack>

        {error && (
          <div
            className="rounded-lg border border-error-500/40 bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950 dark:text-error-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          leftIcon={<MailIcon />}
          fullWidth
          autoComplete="email"
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Send Reset Link
        </Button>

        <p className="text-center text-sm text-text-tertiary">
          Remember your password?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Sign in
          </button>
        </p>
      </Stack>
    </form>
  );
}
