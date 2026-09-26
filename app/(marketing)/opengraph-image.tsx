import { ImageResponse } from 'next/og';
import { LANDING_COPY } from './landing/_content/landing-copy';

export const alt = LANDING_COPY.meta.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori (the renderer behind ImageResponse) needs an embedded font for anything beyond its
// built-in sans, which would mean fetching Playfair Display at build time from Google Fonts.
// That's one more thing that can flake in CI, for a social-preview card few people study closely,
// so this uses bold system type and leans on color and layout for the premium feel instead.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#070b14',
          backgroundImage: 'radial-gradient(circle at 80% 10%, rgba(242,189,92,0.25), transparent 55%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: 44,
            border: '2px solid rgba(242,189,92,0.5)',
            backgroundColor: 'rgba(242,189,92,0.12)',
            color: '#f2bd5c',
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          RB
        </div>
        <div style={{ display: 'flex', fontSize: 66, fontWeight: 700, color: '#f4f1ea', marginTop: 48, maxWidth: 980, lineHeight: 1.12 }}>
          Hospitality at the speed of a scan.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#a9b1c3', marginTop: 28, maxWidth: 820 }}>
          In-room dining, service requests, live status and digital receipts — no app to install.
        </div>
      </div>
    ),
    { ...size }
  );
}
