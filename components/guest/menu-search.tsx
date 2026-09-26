'use client';

import { SearchField } from '@/components/ui/guest-kit/input';
import { GUEST_COPY } from '@/lib/guest/copy';
import { GUEST_TID } from './test-ids';

export function MenuSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      onClear={() => onChange('')}
      placeholder={GUEST_COPY.menu.search.placeholder}
      data-testid={GUEST_TID.menuSearch}
    />
  );
}
