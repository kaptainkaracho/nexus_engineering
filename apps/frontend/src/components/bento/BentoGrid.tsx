import { type ReactNode } from 'react';
import { cn } from '@nexus-engineering/shared';
import './BentoGrid.css';

export type BentoArea =
  | 'feature-main'
  | 'feature-side'
  | 'feature-wide'
  | 'feature-tall'
  | 'feature-wide-2'
  | 'feature-square-2'
  | 'feature-square'
  | 'adr-main'
  | 'adr-side'
  | 'req-featured'
  | 'req-standard'
  | 'req-compact';

export interface BentoGridProps {
  areas?: string;
  columns?: string;
  rows?: string;
  gap?: string;
  responsive?: 'auto-fit' | 'auto-fill';
  minItemWidth?: string;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  role?: string;
  'aria-label'?: string;
}

export function BentoGrid({
  areas,
  columns,
  rows,
  gap = '1rem',
  responsive,
  minItemWidth = '280px',
  className,
  children,
  as: Tag = 'div',
  role,
  'aria-label': ariaLabel,
}: BentoGridProps) {
  const style: React.CSSProperties = {
    '--bento-gap': gap,
    '--bento-min': minItemWidth,
  } as React.CSSProperties;

  if (responsive) {
    style.gridTemplateColumns = `repeat(${responsive}, minmax(min(var(--bento-min), 100%), 1fr))`;
  } else if (columns) {
    style.gridTemplateColumns = columns;
  }

  if (areas) style.gridTemplateAreas = areas;
  if (rows) style.gridTemplateRows = rows;

  return (
    <Tag
      className={cn('bento-grid', className)}
      style={style}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  );
}

export interface BentoCellProps {
  area?: BentoArea | string;
  span?: string;
  className?: string;
  children: ReactNode;
}

export function BentoCell({ area, span, className, children }: BentoCellProps) {
  const style: React.CSSProperties = {};
  if (area) style.gridArea = area;
  if (span) style.gridColumn = span;

  return (
    <div className={cn('bento-cell', className)} style={style} data-area={area}>
      {children}
    </div>
  );
}
