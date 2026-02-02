'use client';

import { cn } from '../../lib/utils';
import { type CSSProperties, type ReactNode } from 'react';

interface TextShimmerProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  return (
    <span
      style={
        {
          '--shimmer-spread': spread,
          '--shimmer-duration': `${duration}s`,
        } as CSSProperties
      }
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        'bg-[length:250%_100%] animate-shimmer',
        '[background-image:linear-gradient(90deg,var(--base-color,#a1a1aa)_calc(50%-var(--shimmer-spread)*0.5em),var(--base-gradient-color,#ffffff)_50%,var(--base-color,#a1a1aa)_calc(50%+var(--shimmer-spread)*0.5em))]',
        className
      )}
    >
      {children}
    </span>
  );
}
