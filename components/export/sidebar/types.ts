import React from 'react';
import { TemplateConfig, ThemeFamilyId, TextColorPresetId } from '../../../types';
import { ColorPalette } from '../../../themes';

export interface SidebarSectionProps {
  template: TemplateConfig;
  onUpdateTemplate: (template: TemplateConfig) => void;
}

export interface ThemeSectionProps extends SidebarSectionProps {
  applyThemeColors: (familyId: ThemeFamilyId) => void;
  prevThemeFamilyRef: React.MutableRefObject<ThemeFamilyId>;
  /** Available color palettes */
  colorPalettes: ColorPalette[];
  /** Currently active palette ID */
  activePaletteId: string | null;
  /** Callback to set active palette */
  onPaletteChange: (paletteId: string) => void;
  /** Callback when text color preset changes */
  onTextColorPresetChange: (preset: TextColorPresetId) => void;
}

export interface FontSectionProps extends SidebarSectionProps {
  availableFonts: string[];
  fontPairs: FontPair[];
  selectedFontPairId: FontPairId;
  setSelectedFontPairId: (id: FontPairId) => void;
  applyFontPair: (pairId: FontPairId) => void;
  openTextColorPicker: TextColorField | null;
  setOpenTextColorPicker: (field: TextColorField | null) => void;
}

export interface BackgroundSectionProps extends SidebarSectionProps {
  isUploadingBackground: boolean;
  setShowBackgroundGallery: (show: boolean) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  SOLID_BG_COLORS: string[];
}

export interface ScaleSectionProps extends SidebarSectionProps {}

export interface LayoutSectionProps extends SidebarSectionProps {}

export interface GridSectionProps extends SidebarSectionProps {}

export type FontPairId = 'none' | 'classic-serif' | 'modern-mix' | 'clean-sans' | 'editorial';

export interface FontPair {
  id: FontPairId;
  name: string;
  description: string;
  titleFont: string;
  subtitleFont: string;
  detailsFont: string;
}

export type TextColorField = 'title' | 'subtitle' | 'details' | null;

export type SidebarSection = 'theme' | 'font' | 'background' | 'scale' | 'layout' | 'grid';
