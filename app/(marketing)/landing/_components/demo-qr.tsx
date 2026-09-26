import QRCode from 'qrcode';
import { LANDING_COPY } from '../_content/landing-copy';
import { CopyLinkButton } from './copy-link-button';

const DEMO_QR_TOKEN = process.env.NEXT_PUBLIC_DEMO_QR_TOKEN ?? 'QR_AZURE_304';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export async function DemoQr() {
  const { liveDemo } = LANDING_COPY;
  const demoUrl = `${SITE_URL}/q/${DEMO_QR_TOKEN}`;

  // The only other dangerouslySetInnerHTML in the guest app is the pre-paint theme boot script
  // (docs/m2/06 §8) — this is an SVG string we generate ourselves from a URL we built ourselves.
  const svg = await QRCode.toString(demoUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return (
    <section id="demo" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
        <div className="flex justify-center">
          <div
            data-testid="landing-demo-qr"
            className="rounded-2xl border-4 border-accent/30 bg-white p-5 shadow-glow"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        <div>
          <h2 className="font-display text-display-lg text-ink">{liveDemo.title}</h2>
          <p className="mt-4 text-ink-muted">{liveDemo.body}</p>
          <p className="mt-4 font-display text-lg text-ink">{liveDemo.subtitle}</p>
          <ol className="mt-4 flex flex-col gap-2">
            {liveDemo.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-ink-muted">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <CopyLinkButton url={demoUrl} label={liveDemo.copyLink} />
          </div>
          <p className="mt-4 text-xs text-ink-subtle">{liveDemo.caption}</p>
        </div>
      </div>
    </section>
  );
}
