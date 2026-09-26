'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/guest-kit/button';

export function PrintQrButton({ label }: { label: string }) {
  return (
    <Button variant="primary" size="md" onClick={() => window.print()} leading={<Printer aria-hidden className="size-4" />} className="no-print">
      {label}
    </Button>
  );
}
