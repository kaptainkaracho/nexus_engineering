import { useState, useCallback, useEffect } from 'react';
import { Button, Alert } from '@nexus-engineering/shared';
import { ArrowRight } from 'lucide-react';
import { OnboardingStepper } from './OnboardingStepper';
import { SkipModal } from './SkipModal';
import { WelcomeStep } from './WelcomeStep';
import { ProfileStep } from './ProfileStep';
import { ProjectStep } from './ProjectStep';
import { TourStep } from './TourStep';

interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  currentStep: 1 | 2 | 3 | 4;
  profile: {
    displayName: string;
    role: string;
    hasAvatar: boolean;
  };
  project: {
    action: 'demo' | 'blank' | 'skip';
    projectId?: string;
  };
  tourCompleted: boolean;
  skipConfirmed: boolean;
}

const STORAGE_KEY = 'nexus_onboarding';
const COMPLETED_KEY = 'nexus_onboarding_completed';

const steps = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Profile' },
  { id: 3, label: 'Project' },
  { id: 4, label: 'Tour' },
];

const defaultState: OnboardingState = {
  completed: false,
  currentStep: 1,
  profile: { displayName: '', role: 'developer', hasAvatar: false },
  project: { action: 'skip' },
  tourCompleted: false,
  skipConfirmed: false,
};

function loadState(): OnboardingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch { /* ignore parse errors */ }
  return defaultState;
}

function saveState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function OnboardingFlow() {
  const [state, setState] = useState<OnboardingState>(loadState);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, currentStep: step }));
    const container = document.querySelector('[role="group"]');
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleNext = useCallback(() => {
    if (state.currentStep < 4) {
      goToStep((state.currentStep + 1) as 2 | 3 | 4);
    }
  }, [state.currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 1) {
      goToStep((state.currentStep - 1) as 1 | 2 | 3);
    }
  }, [state.currentStep, goToStep]);

  const handleSkip = useCallback(() => {
    if (state.skipConfirmed) {
      completeOnboarding();
    } else {
      setShowSkipModal(true);
    }
  }, [state.skipConfirmed]);

  const handleSkipConfirm = useCallback((dontAskAgain: boolean) => {
    setShowSkipModal(false);
    setState((prev) => ({ ...prev, skipConfirmed: dontAskAgain || prev.skipConfirmed }));
    completeOnboarding();
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(COMPLETED_KEY, 'true');
    setShowSuccess(true);
    setTimeout(() => {
      window.location.hash = '/';
    }, 2000);
  };

  const handleProfileSave = useCallback((data: { displayName: string; role: string; avatarUrl?: string }) => {
    setState((prev) => ({
      ...prev,
      currentStep: 3,
      profile: { displayName: data.displayName, role: data.role, hasAvatar: !!data.avatarUrl },
    }));
  }, []);

  const handleImportDemo = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/demo/import', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to import demo');
      const project = await res.json();
      setState((prev) => ({
        ...prev,
        currentStep: 4,
        project: { action: 'demo', projectId: project.id },
      }));
    } catch {
      throw new Error('Failed to import demo project');
    }
  }, []);

  const handleCreateBlank = useCallback(() => {
    window.location.hash = '#/projects/new';
    setState((prev) => ({
      ...prev,
      currentStep: 4,
      project: { action: 'blank' },
    }));
  }, []);

  const completedSteps = [];
  for (let i = 1; i < state.currentStep; i++) completedSteps.push(i);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <Alert variant="success" title="Welcome to Nexus!" className="max-w-md">
          Your workspace is ready.
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-primary-600">Nexus</span>
          <Button variant="ghost" size="sm" onClick={handleSkip} aria-label="Skip onboarding">
            <span className="hidden sm:inline">Skip →</span>
            <ArrowRight className="w-4 h-4 sm:hidden" />
          </Button>
        </div>

        <OnboardingStepper steps={steps} currentStep={state.currentStep} completedSteps={completedSteps} />

        <div className="bg-surface-primary rounded-xl shadow-sm p-8 mt-4">
          {state.currentStep === 1 && <WelcomeStep onGetStarted={handleNext} />}
          {state.currentStep === 2 && (
            <ProfileStep
              initial={{ displayName: state.profile.displayName, role: state.profile.role }}
              onSave={handleProfileSave}
              onBack={handleBack}
            />
          )}
          {state.currentStep === 3 && (
            <ProjectStep
              onImportDemo={handleImportDemo}
              onCreateBlank={handleCreateBlank}
              onBack={handleBack}
            />
          )}
          {state.currentStep === 4 && (
            <TourStep onComplete={completeOnboarding} onBack={handleBack} />
          )}
        </div>
      </div>

      <SkipModal open={showSkipModal} onClose={() => setShowSkipModal(false)} onConfirm={handleSkipConfirm} />
    </div>
  );
}
