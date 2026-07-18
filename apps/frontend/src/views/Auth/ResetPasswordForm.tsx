import { useState } from 'react';
import { Button, Input, Stack } from '@nexus-engineering/shared';
import { resetPassword } from '../../api/auth';

export interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Reset failed. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Stack gap={5} align="center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-950">
          <svg className="h-8 w-8 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Stack gap={2} align="center">
          <h3 className="text-lg font-semibold text-text-primary">Password reset successful</h3>
          <p className="text-center text-sm text-text-tertiary">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </Stack>
        <Button variant="primary" onClick={onSuccess}>
          Sign In
        </Button>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={5}>
        <Stack gap={2}>
          <h3 className="text-lg font-semibold text-text-primary">Reset your password</h3>
          <p className="text-sm text-text-tertiary">
            Enter your new password below.
          </p>
        </Stack>

        {serverError && (
          <div
            className="rounded-lg border border-error-500/40 bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950 dark:text-error-300"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          helperText="At least 8 characters"
          leftIcon={<LockIcon />}
          fullWidth
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          leftIcon={<LockIcon />}
          fullWidth
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Reset Password
        </Button>
      </Stack>
    </form>
  );
}
