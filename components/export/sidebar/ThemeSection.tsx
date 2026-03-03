import React from 'react';
import { Palette } from 'lucide-react';
import { THEME_FAMILY_LIST } from '../../../themes';
import { ThemeFamilyId } from '../../../types';
import { ThemeSectionProps } from './types';
import { GlassRadioGroup } from '../../ui/glass-radio-group';

// Theme thumbnail URLs from Cloudflare R2 (served via API)
const THEME_THUMBNAILS: Record<ThemeFamilyId, string> = {
  'acrylic': '/api/examples/texture/Acrylic.png',
  'default': '/api/examples/texture/Default.png',
  'solid-grain': '/api/examples/texture/Solid_Grain.png',
  'glass': '/api/examples/texture/Default.png', // Using Default as fallback for Glass
};

export const ThemeSection: React.FC<ThemeSectionProps> = ({
  template,
  onUpdateTemplate,
  applyThemeColors,
  prevThemeFamilyRef,
  colorPalettes,
  activePaletteId,
  onPaletteChange,
  onTextColorPresetChange,
}) => {
  const handleThemeSelect = (newFamily: ThemeFamilyId) => {
    // Only update theme-related properties, preserve background settings
    onUpdateTemplate({
      ...template,
      themeFamily: newFamily,
      theme: `${newFamily}-dark` as any,
      themeVariant: 'dark',
      themeSubVariant: undefined,
      eventOpacity: 1,
    });
    // Apply theme colors when switching themes
    if (newFamily !== prevThemeFamilyRef.current) {
      applyThemeColors(newFamily);
      prevThemeFamilyRef.current = newFamily;
    }
  };

  // Get the default palette ID for current theme
  const getDefaultPaletteId = () => {
    if (template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain') {
      return 'dark-slate';
    }
    if (template.themeFamily === 'glass') {
      return 'fresh-tint';
    }
    return 'saturated';
  };

  const currentPaletteId = activePaletteId || getDefaultPaletteId();

  return (
    <div className="space-y-5">
      {/* Theme Style Header */}
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <Palette size={16} /> Theme Style
      </div>

      {/* Theme Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-3">
        {THEME_FAMILY_LIST.map((family) => {
          const isSelected = template.themeFamily === family.id;
          const thumbnailUrl = THEME_THUMBNAILS[family.id as ThemeFamilyId];

          return (
            <button
              key={family.id}
              onClick={() => handleThemeSelect(family.id as ThemeFamilyId)}
              className={`
                group relative rounded-xl overflow-hidden transition-all duration-200
                ${isSelected
                  ? ''
                  : 'cursor-pointer'
                }
              `}
              style={{
                aspectRatio: '1.323',
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(191, 219, 254, 0.95)'
                  : 'none',
              }}
            >
              {/* Thumbnail Image */}
              <img
                src={thumbnailUrl}
                alt={family.name}
                className={`w-full h-full object-cover transition-all duration-200 ${!isSelected ? 'group-hover:brightness-110' : ''}`}
                loading="lazy"
                onError={(e) => {
                  // Fallback gradient if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Hover overlay for non-selected items */}
              {!isSelected && (
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200 pointer-events-none" />
              )}
              {/* Fallback gradient (hidden by default) */}
              <div className="hidden absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
            </button>
          );
        })}

        {/* "More Coming..." placeholder */}
        <div
          className="relative rounded-xl overflow-hidden bg-gray-800/50 flex items-center justify-center border border-gray-700/50"
          style={{ aspectRatio: '1.323' }}
        >
          <span className="text-gray-500 text-xs text-center">
            More<br />Coming...
          </span>
        </div>
      </div>

      {/* Color Palettes Section */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Palettes for Blocks</div>
        <div className="grid grid-cols-2 gap-2">
          {colorPalettes.map((palette) => {
            const isActive = currentPaletteId === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => onPaletteChange(palette.id)}
                className={`
                  flex flex-col items-start gap-1 px-2 py-2 rounded-lg transition-all
                  ${isActive
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'hover:bg-gray-700/50 border border-transparent'
                  }
                `}
              >
                {/* Color dots preview - full width row */}
                <div className="flex gap-0.5 w-full">
                  {palette.colors.slice(0, 6).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {/* Palette name on new line with active indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] text-gray-300 truncate">
                    {palette.name}
                  </span>
                  {isActive && (
                    <span className="text-[9px] text-blue-400 font-medium ml-1">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Color Theme Section */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Text Color Theme</div>
        <GlassRadioGroup
          name="text-color-family"
          options={[
            { id: 'light', label: 'Bright', value: 'light' as const },
            { id: 'dark', label: 'Dark', value: 'dark' as const },
          ]}
          value={template.textColorPreset}
          onChange={(value) => onTextColorPresetChange(value)}
        />
      </div>
    </div>
  );
};
