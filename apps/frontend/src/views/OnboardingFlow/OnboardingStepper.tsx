import { cn } from '@nexus-engineering/shared';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingStepper({ steps, currentStep, completedSteps }: OnboardingStepperProps) {
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div role="progressbar" aria-valuenow={currentStep} aria-valuemax={steps.length} aria-label={`Step ${currentStep} of ${steps.length}`}>
      <div className="hidden sm:flex items-center justify-center gap-2 mb-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  completedSteps.includes(step.id)
                    ? 'bg-primary-500 text-white'
                    : currentStep === step.id
                      ? 'border-2 border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-2 border-border bg-surface-primary text-text-tertiary',
                )}
                aria-current={currentStep === step.id ? 'step' : undefined}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden md:block',
                  completedSteps.includes(step.id) && 'text-primary-500',
                  currentStep === step.id && 'text-primary-700',
                  !completedSteps.includes(step.id) && currentStep !== step.id && 'text-text-tertiary',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12',
                  completedSteps.includes(step.id) ? 'bg-primary-500' : 'bg-border',
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="sm:hidden">
        <div className="w-full bg-border rounded-full h-2 mb-1">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-text-tertiary text-center">
          Step {currentStep} of {steps.length} &mdash; {steps[currentStep - 1]?.label}
        </p>
      </div>
    </div>
  );
}
