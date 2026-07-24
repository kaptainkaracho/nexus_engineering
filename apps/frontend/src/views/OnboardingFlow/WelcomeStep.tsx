import { Button } from '@nexus-engineering/shared';
import { Layers } from 'lucide-react';

interface WelcomeStepProps {
  onGetStarted: () => void;
}

export function WelcomeStep({ onGetStarted }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 stagger-enter">
      <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-0 animate-fade-in">
        <Layers className="w-8 h-8 text-primary-500" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-3 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
        Welcome to Nexus
      </h1>
      <p className="text-base text-text-secondary max-w-md mx-auto mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
        Your engineering intelligence platform. Connect your tools, discover patterns, and ship with confidence.
      </p>
      <Button variant="primary" size="lg" fullWidth onClick={onGetStarted} className="opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
        Get Started →
      </Button>
      <p className="mt-4 text-sm text-text-tertiary opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
        Already set up?{' '}
        <a href="#login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </a>
      </p>
    </div>
  );
}
