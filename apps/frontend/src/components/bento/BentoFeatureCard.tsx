import { type ElementType } from 'react';
import { Card } from '@nexus-engineering/shared';
import { cn } from '@nexus-engineering/shared';

export interface BentoFeatureCardProps {
  icon: ElementType;
  title: string;
  description: string;
  variant?: 'featured' | 'standard' | 'compact';
  className?: string;
}

export function BentoFeatureCard({
  icon: Icon,
  title,
  description,
  variant = 'standard',
  className,
}: BentoFeatureCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <Card
      variant="outlined"
      padding={isFeatured ? 'lg' : 'md'}
      className={cn(
        'h-full transition-all duration-200 hover:shadow-md',
        isFeatured && 'border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-surface-primary dark:from-primary-950/30 dark:to-surface-primary',
        !isFeatured && 'hover:border-border-hover',
        className,
      )}
    >
      <div className={cn('flex flex-col h-full', isFeatured ? 'gap-5' : 'gap-3')}>
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950',
            isFeatured ? 'h-14 w-14' : 'h-10 w-10',
          )}
        >
          <Icon
            className={cn(
              'text-primary-500',
              isFeatured ? 'w-7 h-7' : 'w-5 h-5',
            )}
          />
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              'font-semibold text-text-primary',
              isFeatured ? 'text-lg' : 'text-base',
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-text-secondary mt-1 leading-relaxed',
              isFeatured ? 'text-sm' : 'text-sm',
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}
