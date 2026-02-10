import React from 'react';
import { Maximize2, Monitor, Smartphone } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { AspectRatioSectionProps } from './types';

export const AspectRatioSection: React.FC<AspectRatioSectionProps> = ({
  template,
  onUpdateTemplate,
}) => {
  return (
    <div className="p-4 rounded-xl border space-y-4 card-section-themed">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
          <Maximize2 size={14} /> Aspect Ratio
        </span>
        <span className="text-xs text-gray-500">
          {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
        </span>
      </div>

      {/* Aspect Ratio Slider */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-500">16:9</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={template.aspectRatio}
          onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <span className="text-[10px] text-gray-500">9:16</span>
      </div>

      {/* Quick Presets */}
      <GlassRadioGroup
        name="edit-aspect-ratio"
        options={[
          { id: 'desktop', label: <><Monitor size={12} /> Desktop</>, value: 'desktop' as const },
          { id: 'mobile', label: <><Smartphone size={12} /> Mobile</>, value: 'mobile' as const },
        ]}
        value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
        onChange={(val) => onUpdateTemplate({ ...template, aspectRatio: val === 'desktop' ? 0 : 1 })}
      />
    </div>
  );
};
