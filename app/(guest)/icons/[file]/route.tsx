import { ImageResponse } from 'next/og';

// PWA icons (docs/m2/06 §1): the same midnight-and-gold crest as app/icon.svg and
// app/apple-icon.tsx, at the sizes manifests need. The maskable variant shrinks the ring so it
// survives an OS icon mask cropping up to ~20% from each edge.
const FILES = {
  '192.png': { size: 192, maskable: false },
  '512.png': { size: 512, maskable: false },
  'maskable-512.png': { size: 512, maskable: true },
} as const;

type IconFile = keyof typeof FILES;

export function generateStaticParams() {
  return Object.keys(FILES).map((file) => ({ file }));
}

export async function GET(_request: Request, props: { params: Promise<{ file: string }> }) {
  const { file } = await props.params;
  const config = FILES[file as IconFile];
  if (!config) return new Response('Not found', { status: 404 });

  const { size, maskable } = config;
  const ringSize = Math.round(size * (maskable ? 0.58 : 0.72));
  const borderWidth = Math.max(2, Math.round(size * 0.018));
  const fontSize = Math.round(ringSize * 0.4);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070b14',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            border: `${borderWidth}px solid #f2bd5c`,
            color: '#f2bd5c',
            fontFamily: 'Georgia, serif',
            fontSize,
            fontWeight: 700,
          }}
        >
          RB
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
