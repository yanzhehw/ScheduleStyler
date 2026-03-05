import React from 'react';

interface MobileHeaderBarProps {
  left: React.ReactNode;
  title: string;
  right: React.ReactNode;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({ left, title, right }) => (
  <div
    className="flex items-center justify-between px-1 h-7 rounded-lg mb-0.5 overflow-hidden"
    style={{ backgroundColor: 'var(--panel-background)', borderColor: 'var(--panel-border)' }}
  >
    {left}
    <span className="font-semibold text-white text-[11px]">{title}</span>
    {right}
  </div>
);

/** Shared button styles for MobileHeaderBar left/right slots */
export const headerGhostBtnClass = "inline-btn h-6 px-2 text-[11px] text-gray-300 hover:text-white transition-colors rounded-full flex items-center gap-1";
export const headerAccentBtnClass = "inline-btn h-6 px-2 text-[11px] font-medium btn-accent text-white rounded-full flex items-center gap-1 disabled:opacity-50";
