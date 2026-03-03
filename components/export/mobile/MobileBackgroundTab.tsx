import React from 'react';
import { Image } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileBackgroundTabProps } from './types';

export const MobileBackgroundTab: React.FC<MobileBackgroundTabProps> = ({
  template,
  onUpdateTemplate,
  landscapes,
  portraits,
  isBackgroundsLoading,
  backgroundsError,
  showBackgroundColorPicker,
  setShowBackgroundColorPicker,
  setShowBackgroundGallery,
}) => {
  return (
    <div className="space-y-4">
      {/* Background Type Toggle */}
      <GlassRadioGroup
        name="mobile-background-type"
        options={[
          { id: 'none', label: 'None', value: 'none' as const },
          { id: 'image', label: 'Image', value: 'image' as const },
          { id: 'color', label: 'Color', value: 'color' as const },
        ]}
        value={template.backgroundType}
        onChange={(val) => {
          onUpdateTemplate({ ...template, backgroundType: val });
          if (val === 'color') {
            setShowBackgroundColorPicker(true);
          }
        }}
      />

      {/* Image Gallery */}
      {template.backgroundType === 'image' && (
        <div className="space-y-2">
          {isBackgroundsLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="ml-2 text-gray-400 text-xs">Loading backgrounds...</span>
            </div>
          )}
          {!isBackgroundsLoading && !backgroundsError && (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {[...landscapes, ...portraits].slice(0, 9).map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onUpdateTemplate({
                    ...template,
                    backgroundImage: bg.id,
                    customBackgroundImage: undefined
                  })}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    template.backgroundImage === bg.id
                      ? 'border-blue-500 ring-2 ring-blue-400/50'
                      : 'border-[var(--border-default)]'
                  }`}
                >
                  <img
                    src={bg.thumbnailUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowBackgroundGallery(true)}
            className="w-full px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Image size={14} /> Browse All
          </button>
        </div>
      )}

      {/* Color Picker */}
      {template.backgroundType === 'color' && (
        <div className="space-y-2">
          <span className="text-xs text-gray-400">Background Color</span>
          <div className="grid grid-cols-8 gap-1.5">
            {['#1f2937', '#111827', '#0f172a', '#000000', '#374151', '#4b5563', '#ef4444', '#3b82f6'].map((color) => (
              <button
                key={color}
                onClick={() => onUpdateTemplate({ ...template, backgroundColor: color })}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  template.backgroundColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Blur & Overlay Sliders */}
      {template.backgroundType === 'image' && template.backgroundImage && (
        <div className="space-y-3 pt-2 border-t border-[var(--border-muted)]">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Blur</span>
              <span className="text-xs text-gray-500">{template.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={template.backgroundBlur}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundBlur: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Darken</span>
              <span className="text-xs text-gray-500">{template.backgroundOverlay}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={template.backgroundOverlay}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundOverlay: parseInt(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
        </div>
      )}
    </div>
  );
};
