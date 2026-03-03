import React from 'react';
import { TemplateConfig } from '../../types';

export interface BackgroundLayerProps {
  template: TemplateConfig;
  backgroundImageUrl: string | null;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  template,
  backgroundImageUrl,
}) => (
  <div
    data-component="BackgroundLayer"
    className="absolute inset-0 z-0 overflow-hidden"
    style={{ borderRadius: 'inherit' }}
  >
    {/* Background Image */}
    {template.backgroundType === 'image' && backgroundImageUrl && (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: template.backgroundBlur > 0 ? `blur(${template.backgroundBlur}px)` : undefined,
          // Expand slightly to prevent blur edge artifacts
          ...(template.backgroundBlur > 0 ? {
            top: `-${template.backgroundBlur}px`,
            left: `-${template.backgroundBlur}px`,
            right: `-${template.backgroundBlur}px`,
            bottom: `-${template.backgroundBlur}px`,
          } : {}),
        }}
      />
    )}
    {/* Background Color */}
    {template.backgroundType === 'color' && template.backgroundColor && (
      <div
        className="absolute inset-0"
        style={{ backgroundColor: template.backgroundColor }}
      />
    )}
    {/* Reduce Highlights Overlay - semi-transparent black layer to reduce highlights */}
    {template.backgroundOverlay > 0 && template.backgroundType === 'image' && (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${template.backgroundOverlay / 100})`,
        }}
      />
    )}
  </div>
);
