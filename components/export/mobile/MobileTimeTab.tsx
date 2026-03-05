import React from 'react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileTimeTabProps } from './types';

export const MobileTimeTab: React.FC<MobileTimeTabProps> = ({
  template,
  onUpdateTemplate,
  openTextColorPicker,
  setOpenTextColorPicker,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-gray-400 font-medium italic">Time Column Style</div>
        <button
          onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: undefined, timeColumnBlurAmount: 0 })}
          className="inline-btn text-[10px] text-gray-400 hover:text-gray-200 transition-colors"
        >
          Reset to Default
        </button>
      </div>

      {/* Color swatches */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-gray-400 font-medium">Text Color</label>
        <div className="grid grid-cols-6 gap-1.5">
          {['#111827', '#374151', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdateTemplate({ ...template, timeColumnTextColor: color })}
              className={`inline-btn w-6 h-6 rounded-full border transition-all ${
                template.timeColumnTextColor === color
                  ? 'border-white ring-1 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                  : 'border-[var(--border-default)]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Backdrop Blur */}
      <div className="space-y-2 pt-2 border-t border-[var(--border-muted)]">
        <label className="text-[10px] text-gray-400 font-medium">Backdrop Blur</label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={template.timeColumnBlurAmount}
          onChange={(e) => onUpdateTemplate({ ...template, timeColumnBlurAmount: parseInt(e.target.value) })}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
        />
        <GlassRadioGroup
          name="time-blur-mode-mobile"
          options={[
            { id: 'bar', label: 'Entire Column', value: 'bar' as const },
            { id: 'cells', label: 'Each Cell', value: 'cells' as const },
          ]}
          value={template.timeColumnBlurMode}
          onChange={(val) => onUpdateTemplate({ ...template, timeColumnBlurMode: val })}
          compact
        />
      </div>
    </div>
  );
};
