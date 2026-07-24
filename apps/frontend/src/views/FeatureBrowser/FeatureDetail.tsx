import { useState } from 'react';
import { Badge, Button, Card } from '@nexus-engineering/shared';
import { cn } from '@nexus-engineering/shared';
import { validateFacDocument, type FacFeature, type FacValidationResult } from '../../api/client';
import { getStatusConfig } from './types';
import { UserStoryCard } from './UserStoryCard';
import { TraceLinkItem } from './TraceLinkItem';

interface FeatureDetailProps {
  feature: FacFeature;
  onBack: () => void;
}

function ExpandableSection({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `fb-section-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section className="border-t border-border pt-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {count != null && (
          <span className="text-sm text-text-tertiary">
            ({count})
          </span>
        )}
      </button>
      {open && (
        <div id={contentId} className="mt-3">
          {children}
        </div>
      )}
    </section>
  );
}

export function FeatureDetail({ feature, onBack }: FeatureDetailProps) {
  const status = getStatusConfig(feature.status);
  const stories = feature.userStories ?? [];
  const traces = feature.traceLinks ?? [];
  const [validation, setValidation] = useState<FacValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    setValidation(null);
    try {
      const result = await validateFacDocument({
        features: [feature],
        domain: feature.documentId,
      });
      setValidation(result);
    } catch (err) {
      setValidation({
        valid: false,
        errors: { _error: err instanceof Error ? err.message : 'Validation failed' },
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fb-root">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-sm text-primary-500">
              {status.icon}
            </span>
            <Badge variant={status.badge}>{status.label}</Badge>
            <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-xs text-text-tertiary">
              {feature.documentId}
            </span>
          </div>
          <h2 className="mt-2 truncate text-xl font-bold text-text-primary">{feature.name}</h2>
          <p className="font-mono text-xs text-text-tertiary">{feature.id}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onBack}
          aria-label="Back to feature list"
        >
          ← Features
        </Button>
      </div>

      <p className="text-sm text-text-secondary">{feature.description}</p>

      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleValidate}
          disabled={validating}
          aria-busy={validating}
        >
          {validating ? 'Validating…' : 'Validate schema'}
        </Button>
        {validation && (
          <Badge variant={validation.valid ? 'approved' : 'rejected'}>
            {validation.valid ? 'Schema valid' : 'Schema invalid'}
          </Badge>
        )}
      </div>

      {validation && !validation.valid && validation.errors && (
        <div className="fb-validation" role="alert">
          <p className="text-sm font-medium text-error-600 dark:text-error-400">
            Validation errors
          </p>
          <ul className="fb-validation-errors">
            {Object.entries(validation.errors).map(([field, message]) => (
              <li key={field}>
                <span className="font-mono">{field}</span>: {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <ExpandableSection title="User Stories" count={stories.length} defaultOpen>
          {stories.length === 0 ? (
            <p className="text-sm text-text-tertiary">No user stories defined.</p>
          ) : (
            <div className={cn('flex flex-col gap-3')}>
              {stories.map((story) => (
                <UserStoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </ExpandableSection>

        <ExpandableSection title="Trace Links" count={traces.length} defaultOpen>
          {traces.length === 0 ? (
            <p className="text-sm text-text-tertiary">No trace links defined.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {traces.map((link, i) => (
                <TraceLinkItem key={`${link.target.id}-${i}`} link={link} />
              ))}
            </div>
          )}
        </ExpandableSection>
      </div>
    </div>
  );
}
