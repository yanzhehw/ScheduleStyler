import React from 'react';
import { ThemeFamilyId } from '../../../types';
import { THEME_FAMILY_LIST } from '../../../themes';
import { ThemedDropdown } from '../../ui/themed-dropdown';
import { MobileThemeTabProps } from './types';
import { getDefaultLandscapeId } from '../../../assets/backgrounds';

export const MobileThemeTab: React.FC<MobileThemeTabProps> = ({
  template,
  onUpdateTemplate,
  applyThemeColors,
  prevThemeFamilyRef,
}) => {
  return (
    <div className="space-y-4">
      {/* Theme Family Dropdown */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 font-medium">Theme Style</label>
        <ThemedDropdown
          options={THEME_FAMILY_LIST.map((family) => ({
            id: family.id,
            label: family.name,
            value: family.id as ThemeFamilyId,
          }))}
          value={template.themeFamily}
          onChange={(newFamily) => {
            const needsImageBg = newFamily === 'acrylic' || newFamily === 'glass';
            onUpdateTemplate({
              ...template,
              themeFamily: newFamily,
              theme: `${newFamily}-dark` as any,
              themeVariant: 'dark',
              themeSubVariant: undefined,
              backgroundType: needsImageBg ? 'image' : 'none',
              backgroundImage: newFamily === 'default'
                ? undefined
                : (template.backgroundImage || getDefaultLandscapeId() || 'l1'),
              customBackgroundImage: newFamily === 'default' ? undefined : template.customBackgroundImage,
              eventOpacity: 1,
            });
            if (newFamily !== prevThemeFamilyRef.current) {
              applyThemeColors(newFamily);
              prevThemeFamilyRef.current = newFamily;
            }
          }}
          className="w-full"
        />
      </div>

    </div>
  );
};
