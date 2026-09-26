import * as React from 'react';
import { cn } from '@/lib/cn';

const SHIMMER_STYLE: React.CSSProperties = {
  backgroundImage: 'linear-gradient(90deg, transparent, var(--rb-line-strong), transparent)',
  backgroundSize: '200% 100%',
};

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-shimmer rounded-md bg-surface-2', className)}
      style={{ ...SHIMMER_STYLE, ...style }}
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonMenuItem() {
  return (
    <div className="flex items-start gap-4 border-b border-line py-3" aria-hidden="true">
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="size-24 shrink-0 rounded-lg" />
    </div>
  );
}

export function SkeletonTimeline({ steps = 4 }: { steps?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-line bg-surface p-4" aria-hidden="true">
      <Skeleton className="mb-3 aspect-[16/10] w-full rounded-md" />
      <Skeleton className="mb-2 h-5 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

/** Wraps skeleton content with a single visually-hidden "Loading…" announcement. */
export function SkeletonRegion({ children, label = 'Loading…' }: { children: React.ReactNode; label?: string }) {
  return (
    <div>
      <span className="sr-only" role="status">
        {label}
      </span>
      {children}
    </div>
  );
}
