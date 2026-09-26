'use client';

import * as React from 'react';
import { Search, X, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Field — labels a single child input and wires aria-describedby / aria-invalid
// ---------------------------------------------------------------------------

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function Field({ label, hint, error, htmlFor, optional, children }: FieldProps) {
  const autoId = React.useId();
  const id = htmlFor ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {optional && <span className="text-xs text-ink-subtle">Optional</span>}
      </div>
      {child}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ className, invalid, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-md border bg-surface-2 px-3.5 text-base text-ink placeholder:text-ink-subtle',
        'transition-colors duration-150 focus-ring',
        invalid ? 'border-danger/50' : 'border-line',
        className
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength: number;
  showCount?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, maxLength, showCount = true, value, ref, ...props }: TextareaProps) {
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={cn(
          'min-h-24 w-full resize-none rounded-md border border-line bg-surface-2 px-3.5 py-3 text-base text-ink',
          'placeholder:text-ink-subtle transition-colors duration-150 focus-ring',
          className
        )}
        {...props}
      />
      {showCount && (
        <p className="self-end text-xs tabular text-ink-subtle" aria-live="polite">
          {length} / {maxLength}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SearchField
// ---------------------------------------------------------------------------

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
  'aria-label'?: string;
}

export function SearchField({ value, onChange, placeholder, onClear, className, ...aria }: SearchFieldProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3.5 size-5 text-ink-subtle" strokeWidth={1.75} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={aria['aria-label'] ?? placeholder}
        className="h-12 w-full rounded-full border border-line bg-surface-2 pl-11 pr-11 text-base text-ink placeholder:text-ink-subtle transition-colors duration-150 focus-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onClear?.()}
          aria-label="Clear search"
          className="absolute right-1 grid size-11 place-items-center rounded-full text-ink-subtle hover:text-ink focus-ring"
        >
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NumberStepper
// ---------------------------------------------------------------------------

export interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function NumberStepper({ value, min = 0, max = 20, onChange, label, size = 'md', className }: NumberStepperProps) {
  const atMin = value <= min;
  const dimension = size === 'sm' ? 'size-9' : 'size-11';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={atMin ? `Remove ${label}` : `Decrease quantity of ${label}`}
        className={cn(
          dimension,
          'grid shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-colors duration-150',
          'hover:bg-surface-2 active:scale-[0.98] focus-ring'
        )}
      >
        {atMin ? <Trash2 aria-hidden className="size-4" strokeWidth={1.75} /> : <Minus aria-hidden className="size-4" strokeWidth={1.75} />}
      </button>
      <span className="min-w-6 text-center text-sm tabular font-semibold text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`Increase quantity of ${label}`}
        disabled={value >= max}
        className={cn(
          dimension,
          'grid shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-colors duration-150',
          'hover:bg-surface-2 active:scale-[0.98] focus-ring disabled:opacity-40'
        )}
      >
        <Plus aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
