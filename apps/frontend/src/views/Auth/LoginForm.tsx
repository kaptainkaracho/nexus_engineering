import { useState } from 'react';
import { Alert, Button, Input, Stack } from '@nexus-engineering/shared';
import { login, type LoginRequest } from '../../api/auth';
import { getOAuthUrl } from '../../api/sso';

export interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function SamlIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.email) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      next.password = 'Password is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await login(form);
      onSuccess();
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Login failed. Please try again.';
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
          placeholder="Enter your password"
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
          autoComplete="current-password"
        />

        {onForgotPassword && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forgot password?
            </button>
          </div>
        )}

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Sign In
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-primary px-2 text-text-tertiary">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <a
            href={getOAuthUrl('google')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-primary px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Sign in with Google"
          >
            <GoogleIcon />
            <span className="hidden sm:inline">Google</span>
          </a>
          <a
            href={getOAuthUrl('github')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-primary px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Sign in with GitHub"
          >
            <GitHubIcon />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href={getOAuthUrl('saml')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-primary px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Sign in with SAML"
          >
            <SamlIcon />
            <span className="hidden sm:inline">SAML</span>
          </a>
        </div>

        <p className="text-center text-sm text-text-tertiary">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Create one
          </button>
        </p>
      </Stack>
    </form>
  );
}
