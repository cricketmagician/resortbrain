'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/guest-kit/button';

export default function ItemNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-lg text-ink">This dish isn&rsquo;t on the menu anymore</p>
      <Button variant="primary" size="lg" onClick={() => router.back()} className="mt-6">
        Back to menu
      </Button>
    </div>
  );
}
