import * as React from 'react';
import { cn } from '@/lib/cn';

export type CardTone = 'default' | 'raised' | 'glass' | 'outline';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  interactive?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
}

const TONE_CLASSES: Record<CardTone, string> = {
  default: 'bg-surface border border-line shadow-rb-1',
  raised: 'bg-surface-2 shadow-rb-2',
  glass: 'glass border border-line',
  outline: 'bg-transparent border border-line-strong',
};

export function Card({ tone = 'default', interactive, as = 'div', className, children, ...props }: CardProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn(
        'rounded-lg',
        TONE_CLASSES[tone],
        interactive &&
          'cursor-pointer transition-[transform,border-color] duration-150 ease-[var(--ease-out-soft)] hover:border-line-strong active:scale-[0.99] focus-ring',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-lg text-ink', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 p-4 pt-0', className)} {...props} />;
}
