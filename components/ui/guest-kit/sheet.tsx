'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'auto' | 'tall' | 'full';
  dismissible?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<SheetProps['size']>, string> = {
  auto: '',
  tall: 'h-[80dvh] md:h-auto',
  full: 'h-[92dvh] md:h-auto',
};

export function Sheet({ open, onOpenChange, title, description, children, footer, size = 'auto', dismissible = true }: SheetProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const triggerRef = React.useRef<Element | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      triggerRef.current = document.activeElement;
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = '';
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleCancel(e: Event) {
      if (!dismissible) {
        e.preventDefault();
        return;
      }
      onOpenChange(false);
    }
    function handleClose() {
      onOpenChange(false);
    }

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onOpenChange, dismissible]);

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (!dismissible || e.target !== dialogRef.current) return;
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={handleDialogClick}
      className={cn(
        'fixed inset-x-0 bottom-0 m-0 w-full max-w-full border-0 bg-transparent p-0 backdrop:bg-scrim backdrop:backdrop-blur-sm',
        'md:inset-0 md:m-auto md:h-fit md:max-w-lg'
      )}
    >
      <div
        className={cn(
          'flex w-full flex-col overflow-hidden bg-surface shadow-rb-3',
          'max-h-[92dvh] rounded-t-xl md:max-h-[85dvh] md:rounded-xl',
          'animate-sheet-up md:animate-fade',
          SIZE_CLASSES[size]
        )}
      >
        <div className="shrink-0">
          <div className="flex justify-center pt-2 md:hidden" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-lg text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink focus-ring"
              >
                <X aria-hidden className="size-5" strokeWidth={1.75} />
              </button>
            )}
          </div>
          <div className="border-b border-line" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="safe-bottom shrink-0 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </dialog>
  );
}
