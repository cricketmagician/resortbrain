'use client';

import { useState, type ReactNode } from 'react';
import Image, { type ImageProps } from 'next/image';

// A hotel's banner or logo URL can be unreachable (a stale link, a blocked host, a network blip)
// — next/image has no built-in fallback for that, so this swaps in a tokenised gradient rather
// than showing a broken-image glyph, the same principle as the menu kit's plate tile.
export function ResilientImage({
  alt,
  fallbackClassName,
  fallback,
  ...props
}: ImageProps & { fallbackClassName?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden={alt === ''}
        className={fallbackClassName ?? 'size-full'}
        style={{ backgroundImage: 'linear-gradient(160deg, var(--rb-surface-3), var(--rb-surface-1))' }}
      >
        {fallback}
      </div>
    );
  }

  return <Image alt={alt} {...props} onError={() => setFailed(true)} />;
}
