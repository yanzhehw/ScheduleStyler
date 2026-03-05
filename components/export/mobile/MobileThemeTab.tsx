import React from 'react';
import { ThemeFamilyId } from '../../../types';
import { THEME_FAMILY_LIST } from '../../../themes';
import { MobileThemeTabProps } from './types';
import { getDefaultLandscapeId } from '../../../assets/backgrounds';
import { GlassRadioGroup } from '../../ui/glass-radio-group';

// Theme thumbnail URLs from Cloudflare R2 (served via API)
const THEME_THUMBNAILS: Record<ThemeFamilyId, string> = {
  'acrylic': '/api/examples/texture/Acrylic.png',
  'default': '/api/examples/texture/Default.png',
  'solid-grain': '/api/examples/texture/Solid_Grain.png',
  'glass': '/api/examples/texture/Default.png',
};

export const MobileThemeTab: React.FC<MobileThemeTabProps> = ({
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
    onUpdateTemplate({
      ...template,
      themeFamily: newFamily,
      theme: `${newFamily}-dark` as any,
      themeVariant: 'dark',
      themeSubVariant: undefined,
      eventOpacity: 1,
    });
    if (newFamily !== prevThemeFamilyRef.current) {
      applyThemeColors(newFamily);
      prevThemeFamilyRef.current = newFamily;
    }
  };

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
    <div className="space-y-4">
      {/* Theme Style Thumbnails — 2x2 grid with "More Coming" placeholder */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-gray-400 font-medium">Theme Style</label>
        <div className="grid grid-cols-4 gap-1.5">
          {THEME_FAMILY_LIST.map((family) => {
            const isSelected = template.themeFamily === family.id;
            const thumbnailUrl = THEME_THUMBNAILS[family.id as ThemeFamilyId];
            return (
              <button
                key={family.id}
                onClick={() => handleThemeSelect(family.id as ThemeFamilyId)}
                className={`group relative rounded-lg overflow-hidden transition-all duration-200 ${!isSelected ? 'cursor-pointer' : ''}`}
                style={{
                  aspectRatio: '1.323',
                  boxShadow: isSelected ? '0 0 0 2px rgba(191, 219, 254, 0.95)' : 'none',
                }}
              >
                <img
                  src={thumbnailUrl}
                  alt={family.name}
                  className={`w-full h-full object-cover transition-all duration-200 ${!isSelected ? 'group-hover:brightness-110' : ''}`}
                  loading="lazy"
                />
                {!isSelected && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200 pointer-events-none" />
                )}
              </button>
            );
          })}
          {/* "More Coming..." placeholder */}
          <div
            className="relative rounded-lg overflow-hidden bg-gray-800/50 flex items-center justify-center border border-gray-700/50"
            style={{ aspectRatio: '1.323' }}
          >
            <span className="text-gray-500 text-[10px] text-center leading-tight">
              More<br />Coming...
            </span>
          </div>
        </div>
      </div>

      {/* Color Palettes for Blocks */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Palettes for Blocks</div>
        <div className="grid grid-cols-3 gap-1.5 max-h-[72px] overflow-y-auto">
          {colorPalettes.map((palette) => {
            const isActive = currentPaletteId === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => onPaletteChange(palette.id)}
                className={`flex flex-col items-start gap-1 px-2 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <div className="flex gap-0.5 w-full">
                  {palette.colors.slice(0, 6).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] text-gray-300 truncate">{palette.name}</span>
                  {isActive && (
                    <span className="text-[9px] text-blue-400 font-medium ml-1">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Color Theme */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Text Color Theme</div>
        <GlassRadioGroup
          name="mobile-text-color-family"
          options={[
            { id: 'light', label: 'Bright', value: 'light' as const },
            { id: 'dark', label: 'Dark', value: 'dark' as const },
          ]}
          value={template.textColorPreset}
          onChange={(value) => onTextColorPresetChange(value)}
          compact
        />
      </div>
    </div>
  );
};
