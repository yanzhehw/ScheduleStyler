import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileScaleTabProps } from './types';

export const MobileScaleTab: React.FC<MobileScaleTabProps> = ({
  template,
  onUpdateTemplate,
}) => {
  return (
    <div className="space-y-4">
      {/* Aspect Ratio Slider */}
      <div className={`space-y-2 ${template.lockscreenMockup ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Aspect Ratio</span>
          <span className="text-xs text-gray-500">
            {template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">16:9</span>
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
          <span className="text-xs text-gray-500">9:16</span>
        </div>
        <GlassRadioGroup
          name="mobile-aspect-ratio"
          options={[
            { id: 'desktop', label: <><Monitor size={14} /> Desktop</>, value: 'desktop' as const },
            { id: 'mobile', label: <><Smartphone size={14} /> Mobile</>, value: 'mobile' as const },
          ]}
          value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
          onChange={(val) => onUpdateTemplate({ ...template, aspectRatio: val === 'desktop' ? 0 : 1 })}
          disabled={template.lockscreenMockup}
        />
      </div>

      {/* Lockscreen Mockup */}
      <div className="flex items-center justify-between p-3 rounded-lg card-section-themed">
        <span className="text-xs text-gray-300">iPhone Mockup</span>
        <div
          onClick={() => {
            const newMockupState = !template.lockscreenMockup;
            onUpdateTemplate({
              ...template,
              lockscreenMockup: newMockupState,
              ...(newMockupState && { aspectRatio: 1 })
            });
          }}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${template.lockscreenMockup ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.lockscreenMockup ? 'left-6' : 'left-1'}`} />
        </div>
      </div>
    </div>
  );
};
