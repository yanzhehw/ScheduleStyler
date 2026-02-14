import React from 'react';
import { Maximize2, Monitor, Smartphone } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { ScaleSectionProps } from './types';

interface ScaleSectionExtendedProps extends ScaleSectionProps {
  onEnableMockup?: () => void;
}

export const ScaleSection: React.FC<ScaleSectionExtendedProps> = ({
  template,
  onUpdateTemplate,
  onEnableMockup,
  onAspectRatioChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Maximize2 size={16} /> Scale & Ratio
      </div>

      {/* Background Aspect Ratio - disabled when lockscreen mockup is enabled */}
      <div className={`space-y-2 ${template.lockscreenMockup ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Background Ratio</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {template.lockscreenMockup ? 'Locked' : template.aspectRatio <= 0.5 ? 'Landscape' : 'Portrait'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>16:9</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={template.aspectRatio}
            onChange={(e) => {
              const newRatio = parseFloat(e.target.value);
              if (onAspectRatioChange) {
                onAspectRatioChange(newRatio);
              } else {
                onUpdateTemplate({ ...template, aspectRatio: newRatio });
              }
            }}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            disabled={template.lockscreenMockup}
          />
          <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>9:19</span>
        </div>
        {/* Quick Presets */}
        <GlassRadioGroup
          name="aspect-ratio"
          options={[
            { id: 'desktop', label: <><Monitor size={12} /> Desktop</>, value: 'desktop' as const },
            { id: 'mobile', label: <><Smartphone size={12} /> Mobile</>, value: 'mobile' as const },
          ]}
          value={template.aspectRatio <= 0.5 ? 'desktop' : 'mobile'}
          onChange={(val) => {
            const newRatio = val === 'desktop' ? 0 : 1;
            if (onAspectRatioChange) {
              onAspectRatioChange(newRatio);
            } else {
              onUpdateTemplate({ ...template, aspectRatio: newRatio });
            }
          }}
          disabled={template.lockscreenMockup}
        />
      </div>

      {/* Lockscreen Mockup */}
      <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Smartphone size={12} /> iPhone Mockup
          </span>
          <div
            onClick={() => {
              const newMockupState = !template.lockscreenMockup;
              onUpdateTemplate({
                ...template,
                lockscreenMockup: newMockupState,
                ...(newMockupState && { aspectRatio: 1 })
              });
              if (newMockupState && onEnableMockup) {
                onEnableMockup();
              }
            }}
            className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer shrink-0 ${template.lockscreenMockup ? 'toggle-accent-bg' : 'toggle-off-bg'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${template.lockscreenMockup ? 'left-6' : 'left-1'}`} />
          </div>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Preview with lock screen frame</p>
      </div>
    </div>
  );
};
