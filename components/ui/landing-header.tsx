import React from 'react';
import { Link } from 'react-router-dom';
import faviconLight from '../../assets/FavIcon_WhiteLine.png';

interface LandingHeaderProps {
  onGetStarted?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onGetStarted }) => {
  const navLinks = [
    { label: 'About', href: '/about' },
    { label: 'Community', href: '/community' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 md:py-6">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={faviconLight} alt="ScheduleStyler" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          </div>
          <span className="font-semibold text-white text-xl tracking-tight hidden sm:inline">
            ScheduleStyler
          </span>
        </Link>

        {/* Centered Navigation */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="px-5 py-2.5 text-sm font-semibold text-zinc-950 bg-white rounded-full hover:bg-zinc-200 transition-colors"
        >
          Get Started
        </button>
      </div>
    </header>
  );
};
