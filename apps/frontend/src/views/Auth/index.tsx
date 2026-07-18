import { useState } from 'react';
import { Card, Container, Stack } from '@nexus-engineering/shared';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export interface AuthPageProps {
  onAuthenticated: () => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <Container size="sm" className="py-16">
      <Stack gap={8} align="center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-text-inverse">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">The Bike App</h1>
            <p className="text-sm text-text-tertiary">Sign in to continue</p>
          </div>
        </div>

        <Card padding="lg" className="w-full">
          <Stack gap={6}>
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

            {mode === 'login' ? (
              <LoginForm
                onSuccess={onAuthenticated}
                onSwitchToRegister={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={onAuthenticated}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default AuthPage;
