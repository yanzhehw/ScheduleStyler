'use client';

import React, { type ReactNode, type CSSProperties } from 'react';

interface ElectricBorderProps {
  children: ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  borderRadius?: number;
  style?: CSSProperties;
  className?: string;
}

export function ElectricBorder({
  children,
  color = '#dedaf2',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  style = {},
  className = '',
}: ElectricBorderProps) {
  const thickness = 2;

  return (
    <div
      className={`electric-border-wrapper ${className}`}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      <div
        className="electric-border-glow"
        style={{
          position: 'absolute',
          inset: -thickness,
          borderRadius: borderRadius + thickness,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          backgroundSize: '200% 100%',
          animation: `electric-shimmer ${speed}s linear infinite`,
          filter: `blur(${thickness}px)`,
          opacity: 0.6 + chaos * 10,
          pointerEvents: 'none',
        }}
      />
      <div
        className="electric-border-line"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          border: `${thickness}px solid transparent`,
          background: `linear-gradient(var(--electric-bg, #0f172a), var(--electric-bg, #0f172a)) padding-box, linear-gradient(90deg, transparent, ${color}, transparent) border-box`,
          backgroundSize: '100% 100%, 200% 100%',
          animation: `electric-shimmer ${speed}s linear infinite`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          boxSizing: 'border-box',
          padding: thickness,
          borderRadius: borderRadius,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes electric-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ElectricBorder;
