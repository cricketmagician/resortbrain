import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
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
            width: 140,
            height: 140,
            borderRadius: 70,
            border: '4px solid #f2bd5c',
            color: '#f2bd5c',
            fontFamily: 'Georgia, serif',
            fontSize: 56,
            fontWeight: 700,
          }}
        >
          RB
        </div>
      </div>
    ),
    { ...size }
  );
}
