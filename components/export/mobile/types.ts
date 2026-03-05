import React from 'react';
import { TemplateConfig, ThemeFamilyId } from '../../../types';

/**
 * Shared props for mobile tab content components.
 * These are passed from the parent ExportStep component.
 */
export interface MobileTabContentProps {
  template: TemplateConfig;
  onUpdateTemplate: (template: TemplateConfig) => void;
}

export interface MobileThemeTabProps extends MobileTabContentProps {
  applyThemeColors: (familyId: ThemeFamilyId) => void;
  prevThemeFamilyRef: React.MutableRefObject<ThemeFamilyId>;
  getDefaultLandscapeId: () => string | undefined;
  colorPalettes: { id: string; name: string; colors: string[] }[];
  activePaletteId: string | null;
  onPaletteChange: (paletteId: string) => void;
  onTextColorPresetChange: (preset: 'light' | 'dark') => void;
}

export interface MobileBackgroundTabProps extends MobileTabContentProps {
  landscapes: BackgroundImage[];
  portraits: BackgroundImage[];
  isBackgroundsLoading: boolean;
  backgroundsError: boolean;
  showBackgroundColorPicker: boolean;
  setShowBackgroundColorPicker: (show: boolean) => void;
  setShowBackgroundGallery: (show: boolean) => void;
}

export interface MobileScaleTabProps extends MobileTabContentProps {}

export interface MobileContentTabProps extends MobileTabContentProps {}

export interface MobileHeaderTabProps extends MobileTabContentProps {
  openTextColorPicker: string | null;
  setOpenTextColorPicker: (field: string | null) => void;
}

export interface MobileTimeTabProps extends MobileTabContentProps {
  openTextColorPicker: string | null;
  setOpenTextColorPicker: (field: string | null) => void;
}

export interface MobileColorTabProps extends MobileTabContentProps {
  selectedEvent: any | undefined;
  eventColors: string[];
  defaultEventColors: string[];
  handleColorChange: (color: string) => void;
}

export interface BackgroundImage {
  id: string;
  name: string;
  thumbnailUrl: string;
}

export interface MobileFontTabProps extends MobileTabContentProps {
  availableFonts: string[];
  fontPairs: { id: string; name: string; description: string; titleFont: string; subtitleFont: string; detailsFont: string }[];
  selectedFontPairId: string;
  setSelectedFontPairId: (id: string) => void;
  applyFontPair: (pairId: string) => void;
  openTextColorPicker: string | null;
  setOpenTextColorPicker: (field: string | null) => void;
}

export type MobileExportTab = 'theme' | 'background' | 'scale' | 'content' | 'font' | 'header' | 'time' | 'color';
