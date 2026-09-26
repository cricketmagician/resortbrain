import { Button } from '@/components/ui/guest-kit/button';

export default function HotelNotFound() {
  return (
    <div data-theme="dark" className="dark flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <span className="mb-6 grid size-20 place-items-center rounded-full border-2 border-line-strong">
        <span className="font-display text-2xl text-ink-muted">RB</span>
      </span>
      <h1 className="font-display text-display-md text-ink">We couldn&rsquo;t find that hotel</h1>
      <p className="mt-3 max-w-xs text-sm text-ink-muted">Check the link, or scan the QR code in your room to get back to your stay.</p>
      <Button href="/" variant="primary" size="lg" className="mt-8">
        Back to ResortBrain
      </Button>
    </div>
  );
}
