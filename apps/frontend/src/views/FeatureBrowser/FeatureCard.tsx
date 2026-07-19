import { Badge, Card } from '@nexus-engineering/shared';
import { cn } from '@nexus-engineering/shared';
import { getStatusConfig, type FacFeature } from './types';

interface FeatureCardProps {
  feature: FacFeature;
  isSelected: boolean;
  onSelect: (id: string) => void;
  tabIndex?: number;
}

export function FeatureCard({ feature, isSelected, onSelect, tabIndex = -1 }: FeatureCardProps) {
  const status = getStatusConfig(feature.status);
  const storyCount = feature.userStories?.length ?? 0;

  return (
    <Card
      id={`fb-option-${feature.id}`}
      variant="outlined"
      padding="md"
      role="option"
      aria-selected={isSelected}
      tabIndex={tabIndex}
      onClick={() => onSelect(feature.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(feature.id);
        }
      }}
      className={cn(
        'cursor-pointer transition-colors duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary-500 bg-primary-500/5'
          : 'hover:bg-surface-secondary/50',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center text-sm leading-none',
            isSelected ? 'text-primary-500' : 'text-text-tertiary',
          )}
        >
          {status.icon}
        </span>
        <Badge variant={status.badge}>{status.label}</Badge>
        <span className="truncate text-sm font-semibold text-text-primary">{feature.name}</span>
      </div>
      <span className="mt-1 block text-xs text-text-tertiary">
        {feature.documentId} · {storyCount} {storyCount === 1 ? 'story' : 'stories'}
      </span>
    </Card>
  );
}
