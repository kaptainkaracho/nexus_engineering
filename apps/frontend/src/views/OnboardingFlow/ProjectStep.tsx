import { useState } from 'react';
import { Button, Card } from '@nexus-engineering/shared';
import { Rocket, Plus, Loader2 } from 'lucide-react';

interface ProjectStepProps {
  onImportDemo: () => Promise<void>;
  onCreateBlank: () => void;
  onBack: () => void;
}

export function ProjectStep({ onImportDemo, onCreateBlank, onBack }: ProjectStepProps) {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      await onImportDemo();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div role="group" aria-label="Step 3: First Project">
      <h2 className="text-2xl font-semibold text-text-primary mb-1">Your first project</h2>
      <p className="text-sm text-text-secondary mb-6">Let's get some data in Nexus</p>

      <div className="flex flex-col gap-4 mb-6">
        <Card variant="elevated" padding="lg" className="hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary">Explore Demo Project</h3>
              <p className="text-sm text-text-secondary mt-1">See Nexus in action with a pre-built demo project</p>
              <Button variant="primary" size="sm" className="mt-3" onClick={handleImport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Importing...' : 'Import demo →'}
              </Button>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="lg" className="hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary">Create Blank Project</h3>
              <p className="text-sm text-text-secondary mt-1">Start from scratch with an empty project</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={onCreateBlank}>
                Create blank →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-sm text-text-secondary text-center mb-6">
        Also:{' '}
        <a href="#/integrations" className="text-primary-600 hover:text-primary-700">
          Connect your repo
        </a>
        <br />
        Link a GitHub/GitLab repository to automatically import data.
      </p>

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="lg" onClick={onBack} aria-label="Go to previous step">
          ← Back
        </Button>
        <Button variant="primary" size="lg" aria-label="Go to next step" disabled>
          Next →
        </Button>
      </div>
    </div>
  );
}
