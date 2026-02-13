import React from 'react';
import HeroSection from './ui/glassmorphism-trust-hero';
import { LandingHeader } from './ui/landing-header';
import ImageGallery from './ui/image-gallery';
import Footer4Col from './ui/footer-column';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen w-full overflow-auto bg-zinc-950">
      <LandingHeader onGetStarted={onGetStarted} />
      <div className="flex min-h-screen w-full items-center justify-center">
        <HeroSection onGetStarted={onGetStarted} />
      </div>
      <ImageGallery />
      <Footer4Col />
    </div>
  );
};
