'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/guest-kit/button';

export function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied — the link is still visible for the guest to select.
    }
  }

  return (
    <Button variant="secondary" size="md" onClick={handleCopy} leading={copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
