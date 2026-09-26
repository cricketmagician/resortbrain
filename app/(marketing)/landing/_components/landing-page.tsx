import { Hero } from './hero';
import { BuiltFor } from './built-for';
import { Problem } from './problem';
import { HowItWorks } from './how-it-works';
import { GuestShowcase } from './guest-showcase';
import { OperationsTeaser } from './operations-teaser';
import { SecurityBand } from './security-band';
import { DemoQr } from './demo-qr';
import { Roadmap } from './roadmap';
import { FinalCta } from './final-cta';

export function LandingPage() {
  return (
    <div data-testid="landing">
      <Hero />
      <BuiltFor />
      <Problem />
      <HowItWorks />
      <GuestShowcase />
      <OperationsTeaser />
      <SecurityBand />
      <DemoQr />
      <Roadmap />
      <FinalCta />
    </div>
  );
}
