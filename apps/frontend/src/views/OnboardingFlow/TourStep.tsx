import { Button } from '@nexus-engineering/shared';
import { Compass } from 'lucide-react';

const tourItems = [
  { number: 1, title: 'Dashboard', description: 'View your engineering metrics and recent activity.' },
  { number: 2, title: 'Discovery', description: 'Search and browse artifacts across your connected sources.' },
  { number: 3, title: 'Projects', description: 'Manage requirements, features, and traceability.' },
  { number: 4, title: 'Settings', description: 'Configure your org, integrations, and team members.' },
];

interface TourStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function TourStep({ onComplete, onBack }: TourStepProps) {
  return (
    <div role="group" aria-label="Step 4: Quick Tour">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950 rounded-2xl flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-2xl font-semibold text-text-primary">You're all set!</h2>
        <p className="text-sm text-text-secondary mt-1">Here's a quick tour of your workspace:</p>
      </div>

      <div className="space-y-2 mb-6">
        {tourItems.map((item) => (
          <div
            key={item.number}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-tertiary/30 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-50 text-primary-600 font-semibold text-sm rounded-full flex items-center justify-center flex-shrink-0">
              {item.number}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{item.title}</p>
              <p className="text-sm text-text-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-tertiary text-center mb-6">
        Tip: You can replay this tour anytime from the Help menu.
      </p>

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="lg" onClick={onBack} aria-label="Go to previous step">
          ← Back
        </Button>
        <Button variant="primary" size="lg" onClick={onComplete} aria-label="Start using Nexus">
          Start using Nexus →
        </Button>
      </div>
    </div>
  );
}
