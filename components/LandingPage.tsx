import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from './ui/glassmorphism-trust-hero';
import { LandingHeader } from './ui/landing-header';
import ImageGallery from './ui/image-gallery';
import Footer4Col from './ui/footer-column';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <>
      <Helmet>
        <title>Schedule Styler - Free College Schedule Maker</title>
        <meta name="description" content="Transform messy timetable screenshots into aesthetic schedules. Free online college schedule maker with lockscreen-ready exports." />
      </Helmet>
      <div className="relative min-h-screen w-full">
      <LandingHeader onGetStarted={onGetStarted} />
      <div className="flex min-h-screen w-full items-center justify-center">
        <HeroSection onGetStarted={onGetStarted} />
      </div>
      <ImageGallery />
      <Footer4Col />
      </div>
    </>
  );
};
