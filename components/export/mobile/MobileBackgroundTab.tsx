import React, { useRef } from 'react';
import { Image, Upload } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { MobileBackgroundTabProps } from './types';

const BG_COLORS = [
  '#1f2937', '#111827', '#0f172a', '#000000',
  '#374151', '#4b5563', '#6b7280', '#9ca3af',
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <div className="overflow-y-auto h-36 custom-scrollbar" style={{ touchAction: 'pan-y' }}>
              <div className="flex gap-2">
                {/* Landscape column */}
                <div className="w-[48%] shrink-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-wide text-gray-500">Landscape</span>
                  <div className="space-y-1">
                    {landscapes.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => onUpdateTemplate({
                          ...template,
                          backgroundImage: bg.id,
                          customBackgroundImage: undefined
                        })}
                        className={`relative w-full aspect-video rounded-md overflow-hidden border-2 transition-all ${
                          template.backgroundImage === bg.id && !template.customBackgroundImage
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Portrait columns */}
                <div className="w-[48%] shrink-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-wide text-gray-500">Portrait</span>
                  <div className="grid grid-cols-2 gap-1">
                    {portraits.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => onUpdateTemplate({
                          ...template,
                          backgroundImage: bg.id,
                          customBackgroundImage: undefined
                        })}
                        className={`relative w-full aspect-[9/16] rounded-md overflow-hidden border-2 transition-all ${
                          template.backgroundImage === bg.id && !template.customBackgroundImage
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom uploaded image thumbnail */}
          {template.customBackgroundImage && (
            <div className="pt-2 border-t border-[var(--border-muted)]">
              <span className="text-[9px] uppercase tracking-wide mb-1 block text-gray-500">Custom</span>
              <button
                onClick={() => onUpdateTemplate({ ...template, backgroundImage: 'custom' })}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  template.backgroundImage === 'custom' ? 'border-blue-500 ring-2 ring-blue-400/50' : 'border-[var(--border-default)]'
                }`}
              >
                <img src={template.customBackgroundImage} alt="Custom" className="w-full h-full object-cover" />
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  onUpdateTemplate({
                    ...template,
                    customBackgroundImage: dataUrl,
                    backgroundImage: 'custom',
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowBackgroundGallery(true)}
              className="flex-1 px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Image size={14} /> Gallery
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-3 py-2 button-ghost-themed rounded-lg text-xs text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Upload
            </button>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {template.backgroundType === 'color' && (
        <div className="space-y-3">
          <span className="text-xs text-gray-400">Background Color</span>

          {/* Hex input with color preview */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md border-2 shrink-0"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: template.backgroundColor || '#1f2937',
              }}
            />
            <input
              type="text"
              value={template.backgroundColor || '#1f2937'}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(val) || val === '') {
                  onUpdateTemplate({ ...template, backgroundColor: val });
                }
              }}
              className="flex-1 px-2 py-1 border rounded-md text-xs font-mono"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--input-background)',
                borderColor: 'var(--border-default)',
              }}
              placeholder="#1f2937"
            />
          </div>

          {/* Full 20-color grid */}
          <div className="grid grid-cols-10 gap-1">
            {BG_COLORS.map((color) => (
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
      {template.backgroundType === 'image' && (template.backgroundImage || template.customBackgroundImage) && (
        <div className="flex gap-3 pt-2 border-t border-[var(--border-muted)]">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Blur</span>
              <span className="text-[10px] text-gray-500">{template.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={template.backgroundBlur}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundBlur: parseInt(e.target.value) })}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Darken</span>
              <span className="text-[10px] text-gray-500">{template.backgroundOverlay}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={template.backgroundOverlay}
              onChange={(e) => onUpdateTemplate({ ...template, backgroundOverlay: parseInt(e.target.value) })}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
            />
          </div>
        </div>
      )}
    </div>
  );
};
