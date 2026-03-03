import React from 'react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileHeaderTabProps } from './types';

export const MobileHeaderTab: React.FC<MobileHeaderTabProps> = ({
  template,
  onUpdateTemplate,
  openTextColorPicker,
  setOpenTextColorPicker,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 font-medium italic">Day Header Style</div>

      {/* Color swatches */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Text Color</label>
        <div className="grid grid-cols-6 gap-2">
          {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdateTemplate({ ...template, headerTextColor: color })}
              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                template.headerTextColor === color
                  ? 'border-white scale-110 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                  : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <div className="space-y-2 pt-3 border-t border-[var(--border-muted)]">
        <label className="text-xs text-gray-400 font-medium">Backdrop Blur</label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={template.headerBlurAmount}
          onChange={(e) => onUpdateTemplate({ ...template, headerBlurAmount: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <GlassRadioGroup
          name="header-blur-mode-mobile"
          options={[
            { id: 'bar', label: 'Entire Row', value: 'bar' as const },
            { id: 'cells', label: 'Each Cell', value: 'cells' as const },
          ]}
          value={template.headerBlurMode}
          onChange={(val) => onUpdateTemplate({ ...template, headerBlurMode: val })}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => onUpdateTemplate({ ...template, headerTextColor: undefined, headerBlurAmount: 0 })}
        className="w-full px-3 py-2 button-ghost-themed rounded-lg text-sm text-gray-200 font-medium transition-colors"
      >
        Reset to Default
      </button>
    </div>
  );
};
