'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'chip';
export type ButtonSize = 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  pressed?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ' +
  'transition-[transform,filter,background-color,color,box-shadow] duration-150 ease-[var(--ease-out-soft)] ' +
  'focus-ring select-none disabled:opacity-50 disabled:pointer-events-none';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-cta shadow-glow rounded-full font-semibold hover:brightness-105 active:scale-[0.98]',
  secondary: 'bg-surface-2 text-ink border border-line-strong rounded-full hover:bg-surface-3 active:scale-[0.98]',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-2 rounded-full active:scale-[0.98]',
  danger: 'bg-danger-soft text-danger border border-danger/30 rounded-full hover:brightness-105 active:scale-[0.98]',
  chip: 'h-11 px-4 rounded-full border border-line bg-surface text-ink-muted hover:border-line-strong active:scale-[0.98]',
};

const PRESSED_CHIP = 'bg-accent-soft! text-accent! border-accent/40!';

const SIZE_CLASSES: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: { md: 'h-11 px-5', lg: 'h-13 px-6 text-base', icon: 'size-11' },
  secondary: { md: 'h-11 px-5', lg: 'h-13 px-6 text-base', icon: 'size-11' },
  ghost: { md: 'h-11 px-4', lg: 'h-13 px-6 text-base', icon: 'size-11' },
  danger: { md: 'h-11 px-5', lg: 'h-13 px-6 text-base', icon: 'size-11' },
  chip: { md: '', lg: '', icon: '' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  pressed,
  leading,
  trailing,
  fullWidth,
  href,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  const classes = cn(
    BASE,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[variant][size],
    variant === 'chip' && pressed && PRESSED_CHIP,
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {leading}
        {children}
        {trailing}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 aria-hidden className="size-5 animate-spin" strokeWidth={2} />
        </span>
      )}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes} aria-pressed={variant === 'chip' ? pressed : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-pressed={variant === 'chip' ? pressed : undefined}
      tabIndex={loading ? -1 : props.tabIndex}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}
