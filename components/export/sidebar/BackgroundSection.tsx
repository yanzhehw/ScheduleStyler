import React from 'react';
import { Image, Upload, Droplet, Moon } from 'lucide-react';
import { GlassRadioGroup } from '../../ui/glass-radio-group';
import { BackgroundSectionProps } from './types';

interface BackgroundImage {
  id: string;
  name: string;
  thumbnailUrl: string;
}

interface BackgroundSectionExtendedProps extends BackgroundSectionProps {
  landscapes: BackgroundImage[];
  portraits: BackgroundImage[];
  isBackgroundsLoading: boolean;
  backgroundsError: boolean;
  showBackgroundColorPicker: boolean;
  setShowBackgroundColorPicker: (show: boolean) => void;
  backgroundFileInputRef: React.RefObject<HTMLInputElement>;
}

const BG_COLORS = [
  '#1f2937', '#111827', '#0f172a', '#000000',
  '#374151', '#4b5563', '#6b7280', '#9ca3af',
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#f43f5e',
];

export const BackgroundSection: React.FC<BackgroundSectionExtendedProps> = ({
  template,
  onUpdateTemplate,
  setShowBackgroundGallery,
  landscapes,
  portraits,
  isBackgroundsLoading,
  backgroundsError,
  showBackgroundColorPicker,
  setShowBackgroundColorPicker,
  backgroundFileInputRef,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Image size={16} /> Background
      </div>
      <div className="space-y-4">
        {/* Background Type Toggle */}
        <GlassRadioGroup
          name="background-type"
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

        {/* Image Gallery - only shown when type is 'image' */}
        {template.backgroundType === 'image' && (
          <div className="space-y-2">
            {/* Loading state */}
            {isBackgroundsLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</span>
              </div>
            )}
            {/* Error state */}
            {backgroundsError && !isBackgroundsLoading && (
              <div className="text-red-400 text-xs py-4 text-center">Failed to load backgrounds</div>
            )}
            {/* Side-by-side columns */}
            {!isBackgroundsLoading && !backgroundsError && (
              <div className="flex gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {/* Landscape column */}
                <div className="w-[48%] shrink-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Landscape</span>
                  <div className="space-y-1">
                    {landscapes.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => onUpdateTemplate({
                          ...template,
                          backgroundImage: bg.id,
                          customBackgroundImage: undefined
                        })}
                        className={`relative w-full aspect-video rounded-md overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                          template.backgroundImage === bg.id && !template.customBackgroundImage
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Portrait columns */}
                <div className="w-[48%] shrink-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Portrait</span>
                  <div className="grid grid-cols-2 gap-1">
                    {portraits.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => onUpdateTemplate({
                          ...template,
                          backgroundImage: bg.id,
                          customBackgroundImage: undefined
                        })}
                        className={`relative w-full aspect-[9/16] rounded-md overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                          template.backgroundImage === bg.id && !template.customBackgroundImage
                            ? 'border-blue-500 ring-2 ring-blue-400/50'
                            : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <img src={bg.thumbnailUrl} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom uploaded image thumbnail */}
            {template.customBackgroundImage && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-muted)' }}>
                <span className="text-[9px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>Custom</span>
                <button
                  onClick={() => onUpdateTemplate({ ...template, backgroundImage: 'custom' })}
                  className={`relative w-16 aspect-video rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                    template.backgroundImage === 'custom'
                      ? 'border-blue-500 ring-2 ring-blue-400/50'
                      : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <img src={template.customBackgroundImage} alt="Custom" className="w-full h-full object-cover" />
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={backgroundFileInputRef}
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
                      backgroundImage: 'custom'
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowBackgroundGallery(true)}
                className="flex-1 px-2 py-1.5 button-ghost-themed rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Image size={12} /> Gallery
              </button>
              <button
                onClick={() => backgroundFileInputRef.current?.click()}
                className="flex-1 px-2 py-1.5 button-ghost-themed rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Upload size={12} /> Upload
              </button>
            </div>
          </div>
        )}

        {/* Color Picker */}
        {template.backgroundType === 'color' && (
          <div className="space-y-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Background Color</span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border-2 cursor-pointer"
                style={{ borderColor: 'var(--border-default)', backgroundColor: template.backgroundColor || '#1f2937' }}
                onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
              />
              <input
                type="text"
                value={template.backgroundColor || '#1f2937'}
                onChange={(e) => onUpdateTemplate({ ...template, backgroundColor: e.target.value })}
                className="flex-1 px-2 py-1.5 border rounded-lg input-themed text-xs font-mono"
                style={{ color: 'var(--text-secondary)' }}
                placeholder="#1f2937"
              />
            </div>
            {showBackgroundColorPicker && (
              <div className="grid grid-cols-8 gap-1 p-2 rounded-lg card-section-themed">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onUpdateTemplate({ ...template, backgroundColor: color });
                      setShowBackgroundColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded border-2 transition-all hover:scale-110 ${
                      template.backgroundColor === color
                        ? 'border-white scale-110'
                        : 'border-transparent hover:border-[var(--border-default)]'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blur & Overlay Sliders */}
        {template.backgroundType === 'image' && (template.backgroundImage || template.customBackgroundImage) && (
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border-muted)' }}>
            <SliderControl
              icon={<Droplet size={10} />}
              label="Blur"
              value={template.backgroundBlur}
              max={20}
              step={1}
              unit="px"
              onChange={(val) => onUpdateTemplate({ ...template, backgroundBlur: val })}
            />
            <SliderControl
              icon={<Moon size={10} />}
              label="Darken"
              value={template.backgroundOverlay}
              max={80}
              step={5}
              unit="%"
              onChange={(val) => onUpdateTemplate({ ...template, backgroundOverlay: val })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface SliderControlProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ icon, label, value, max, step, unit, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        {icon} {label}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{value}{unit}</span>
    </div>
    <input
      type="range"
      min="0"
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-accent slider-track-themed"
    />
  </div>
);
