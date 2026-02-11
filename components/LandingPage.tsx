import React from 'react';
import HeroSection from './ui/glassmorphism-trust-hero';
import { LandingHeader } from './ui/landing-header';
import Footer4Col from './ui/footer-column';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen w-full overflow-auto bg-zinc-950">
      <LandingHeader onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <Footer4Col />
    </div>
  );
};
