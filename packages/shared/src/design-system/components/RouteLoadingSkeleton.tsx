import { cn } from '../utils';

type SkeletonVariant = 'default' | 'grid' | 'table' | 'form' | 'chart';

export interface RouteLoadingSkeletonProps {
  variant?: SkeletonVariant;
  label?: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 rounded-md bg-surface-tertiary',
        'animate-pulse',
        className
      )}
    />
  );
}

function DefaultSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-primary p-6">
          <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
        <div className="rounded-lg border border-border bg-surface-primary p-6">
          <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
        <div className="rounded-lg border border-border bg-surface-primary p-6">
          <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface-primary p-6">
            <Skeleton className="mb-4 h-12 w-12 rounded-lg" />
            <Skeleton className="mb-2 h-5 w-48" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-surface-secondary px-6 py-4">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border px-6 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="max-w-xl space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg bg-surface-tertiary" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="rounded-xl border border-border bg-surface-primary p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="mt-8 flex items-end gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('w-full rounded-t bg-surface-tertiary', [
                'h-24', 'h-32', 'h-20', 'h-40', 'h-28',
                'h-36', 'h-16', 'h-44', 'h-24', 'h-32',
                'h-28', 'h-36', 'h-20', 'h-40', 'h-24',
                'h-32', 'h-16', 'h-44', 'h-28', 'h-36',
              ][i])}
            />
          ))}
        </div>
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
    </div>
  );
}

export function RouteLoadingSkeleton({
  variant = 'default',
  label = 'Loading...',
}: RouteLoadingSkeletonProps) {
  const skeletons: Record<SkeletonVariant, React.ReactNode> = {
    default: <DefaultSkeleton />,
    grid: <GridSkeleton />,
    table: <TableSkeleton />,
    form: <FormSkeleton />,
    chart: <ChartSkeleton />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[400px]"
    >
      <div className="mb-4 px-8 pt-6">
        <p className="text-sm font-medium text-text-tertiary">{label}</p>
      </div>
      <div className="[transform:translateZ(0)]">
        {skeletons[variant]}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
