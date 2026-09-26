import type { Metadata } from 'next';
import { LandingPage } from './landing/_components/landing-page';
import { LANDING_COPY } from './landing/_content/landing-copy';

export const metadata: Metadata = {
  title: { absolute: LANDING_COPY.meta.title },
  description: LANDING_COPY.meta.description,
  openGraph: {
    title: LANDING_COPY.meta.title,
    description: LANDING_COPY.meta.description,
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function Page() {
  return <LandingPage />;
}
