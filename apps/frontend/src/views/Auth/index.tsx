import { useState } from 'react';
import { Card, Container, Stack } from '@nexus-engineering/shared';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export interface AuthPageProps {
  onAuthenticated: () => void;
  resetToken?: string;
}

function getSubtitle(mode: AuthMode): string {
  switch (mode) {
    case 'login':
      return 'Sign in to continue';
    case 'register':
      return 'Create your account';
    case 'forgot-password':
      return 'Reset your password';
    case 'reset-password':
      return 'Set a new password';
  }
}

function showTabs(mode: AuthMode): boolean {
  return mode === 'login' || mode === 'register';
}

export function AuthPage({ onAuthenticated, resetToken }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(resetToken ? 'reset-password' : 'login');

  const handleResetSuccess = () => {
    setMode('login');
  };

  return (
    <Container size="sm" className="py-16">
      <Stack gap={8} align="center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-text-inverse">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">The Bike App</h1>
            <p className="text-sm text-text-tertiary">{getSubtitle(mode)}</p>
          </div>
        </div>

        <Card padding="lg" className="w-full">
          <Stack gap={6}>
            {showTabs(mode) && (
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                    mode === 'login'
                      ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                  aria-current={mode === 'login' ? 'page' : undefined}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                    mode === 'register'
                      ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                  aria-current={mode === 'register' ? 'page' : undefined}
                >
                  Create Account
                </button>
              </div>
            )}

            {mode === 'login' && (
              <LoginForm
                onSuccess={onAuthenticated}
                onSwitchToRegister={() => setMode('register')}
                onForgotPassword={() => setMode('forgot-password')}
              />
            )}
            {mode === 'register' && (
              <RegisterForm
                onSuccess={onAuthenticated}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
            {mode === 'forgot-password' && (
              <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
            )}
            {mode === 'reset-password' && resetToken && (
              <ResetPasswordForm token={resetToken} onSuccess={handleResetSuccess} />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default AuthPage;
