import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileScaleTabProps } from './types';

export const MobileScaleTab: React.FC<MobileScaleTabProps> = ({
  template,
  onUpdateTemplate,
}) => {
  return (
    <div className="space-y-2">
      {/* Aspect Ratio Slider */}
      <div className={`space-y-2 ${template.lockscreenMockup ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Aspect Ratio</span>
          <span className="text-[10px] text-gray-500">
            {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">16:9</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={template.aspectRatio}
            onChange={(e) => onUpdateTemplate({ ...template, aspectRatio: parseFloat(e.target.value) })}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            disabled={template.lockscreenMockup}
          />
          <span className="text-[10px] text-gray-500">9:16</span>
        </div>
      </div>

      {/* Desktop/Mobile radio + iPhone Mockup toggle — single row */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 ${template.lockscreenMockup ? 'opacity-40 pointer-events-none' : ''}`}>
          <GlassRadioGroup
            name="mobile-aspect-ratio"
            options={[
              { id: 'desktop', label: <><Monitor size={12} /> Desktop</>, value: 'desktop' as const },
              { id: 'mobile', label: <><Smartphone size={12} /> Mobile</>, value: 'mobile' as const },
            ]}
            value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
            onChange={(val) => onUpdateTemplate({ ...template, aspectRatio: val === 'desktop' ? 0 : 1 })}
            disabled={template.lockscreenMockup}
            compact
          />
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg card-section-themed cursor-pointer shrink-0"
          onClick={() => {
            const newMockupState = !template.lockscreenMockup;
            onUpdateTemplate({
              ...template,
              lockscreenMockup: newMockupState,
              ...(newMockupState && { aspectRatio: 1 })
            });
          }}
        >
          <span className="text-[10px] text-gray-300">Mockup</span>
          <div className={`w-8 h-4 rounded-full relative transition-all duration-300 ${template.lockscreenMockup ? 'toggle-accent-bg' : 'toggle-off-bg'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.lockscreenMockup ? 'left-4' : 'left-0.5'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
