import React from 'react';
import { Clock, Download, Droplet, Image, Layout, Maximize2, Palette, Type } from 'lucide-react';
import { CalendarEvent, TemplateConfig, SelectableExportComponent, OnboardingComponent, ThemeFamilyId, ResizeEdge } from '../../../types';
import { CalendarCanvas } from '../../CalendarCanvas';
import { MobileFooterToolbar, MobileTab } from '../../small_utility/MobileFooterToolbar';
import { ColorPalette } from '../../../themes';
import { BackgroundImage } from './types';
import { MobileThemeTab } from './MobileThemeTab';
import { MobileBackgroundTab } from './MobileBackgroundTab';
import { MobileScaleTab } from './MobileScaleTab';
import { MobileContentTab } from './MobileContentTab';
import { MobileFontTab } from './MobileFontTab';
import { MobileColorTab } from './MobileColorTab';
import { MobileHeaderTab } from './MobileHeaderTab';
import { MobileTimeTab } from './MobileTimeTab';
import { MobileExportZoomToolbar } from './MobileExportZoomToolbar';
import { MobilePreviewPanel } from './MobilePreviewPanel';
import { MobileBackgroundGalleryModal } from './MobileBackgroundGalleryModal';
import { MobileHeaderBar, headerGhostBtnClass, headerAccentBtnClass } from '../../small_utility/MobileHeaderBar';

interface MobileExportLayoutProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onUpdateTemplate: (template: TemplateConfig) => void;
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onBack: () => void;
  isExporting: boolean;
  handleDownload: () => void;
  supportsZoom: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  isZoomToolbarOpen: boolean;
  setIsZoomToolbarOpen: (open: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
  canvasDimensions: { width: number; height: number; minCardWidth: number; minCardHeight: number };
  setCanvasDimensions: (dims: { width: number; height: number; minCardWidth: number; minCardHeight: number }) => void;
  previewPanelRef: React.RefObject<HTMLDivElement>;
  colorPickerRef: React.RefObject<HTMLDivElement>;
  handleBlankClick: () => void;
  handleEventClick: (event: CalendarEvent) => void;
  selectedComponent: SelectableExportComponent;
  setSelectedComponent: (component: SelectableExportComponent) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedEvent: CalendarEvent | undefined;
  mobileActiveTab: string | null;
  setMobileActiveTab: (tab: string | null) => void;
  onboardingPending: {
    calendarCard: boolean;
    dayHeader: boolean;
    timeColumn: boolean;
    eventBlock: boolean;
  };
  onboardingEventId: string | null;
  handleOnboardingOk: (component: OnboardingComponent) => void;
  showBackgroundGallery: boolean;
  setShowBackgroundGallery: (show: boolean) => void;
  showBackgroundColorPicker: boolean;
  setShowBackgroundColorPicker: (show: boolean) => void;
  landscapes: BackgroundImage[];
  portraits: BackgroundImage[];
  isBackgroundsLoading: boolean;
  backgroundsError: boolean | null;
  applyThemeColors: (familyId: ThemeFamilyId) => void;
  prevThemeFamilyRef: React.MutableRefObject<ThemeFamilyId>;
  colorPalettes: { id: string; name: string; colors: string[] }[];
  activePaletteId: string | null;
  onPaletteChange: (paletteId: string) => void;
  onTextColorPresetChange: (preset: 'light' | 'dark') => void;
  themeColors: string[];
  currentPalette: ColorPalette;
  showPalettePicker: boolean;
  setShowPalettePicker: (value: boolean) => void;
  setActivePaletteId: (id: string) => void;
  applyColorToAll: boolean;
  setApplyColorToAll: (value: boolean) => void;
  shuffleColorsForEvents: (differentiateTypes: boolean) => void;
  triggerColorUpdate: (diff: boolean) => void;
  handleColorSelect: (color: string) => void;
  setShowFontSelector: (value: boolean) => void;
  availableFonts: string[];
  fontPairs: { id: string; name: string; description: string; titleFont: string; subtitleFont: string; detailsFont: string }[];
  selectedFontPairId: string;
  setSelectedFontPairId: (id: string) => void;
  applyFontPair: (pairId: string) => void;
  openTextColorPicker: string | null;
  setOpenTextColorPicker: (field: string | null) => void;
  cachedToggles: {
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null;
  setCachedToggles: (toggles: {
    showClassType: boolean;
    showTime: boolean;
    showLocation: boolean;
    showNotes: boolean;
  } | null) => void;
  hoveredResizeEdge: ResizeEdge;
  onEdgeHover: (edge: ResizeEdge) => void;
  onResizeStart: (edge: ResizeEdge, mousePos: { x: number; y: number }) => void;
}

export const MobileExportLayout: React.FC<MobileExportLayoutProps> = ({
  events,
  template,
  onUpdateTemplate,
  onUpdateEvents,
  onBack,
  isExporting,
  handleDownload,
  supportsZoom,
  zoom,
  isZoomToolbarOpen,
  setIsZoomToolbarOpen,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  canvasDimensions,
  setCanvasDimensions,
  previewPanelRef,
  colorPickerRef,
  handleBlankClick,
  handleEventClick,
  selectedComponent,
  setSelectedComponent,
  selectedEventId,
  setSelectedEventId,
  selectedEvent,
  mobileActiveTab,
  setMobileActiveTab,
  onboardingPending,
  onboardingEventId,
  handleOnboardingOk,
  showBackgroundGallery,
  setShowBackgroundGallery,
  showBackgroundColorPicker,
  setShowBackgroundColorPicker,
  landscapes,
  portraits,
  isBackgroundsLoading,
  backgroundsError,
  applyThemeColors,
  prevThemeFamilyRef,
  colorPalettes,
  activePaletteId,
  onPaletteChange,
  onTextColorPresetChange,
  themeColors,
  currentPalette,
  showPalettePicker,
  setShowPalettePicker,
  setActivePaletteId,
  applyColorToAll,
  setApplyColorToAll,
  shuffleColorsForEvents,
  triggerColorUpdate,
  handleColorSelect,
  setShowFontSelector,
  availableFonts,
  fontPairs,
  selectedFontPairId,
  setSelectedFontPairId,
  applyFontPair,
  openTextColorPicker,
  setOpenTextColorPicker,
  cachedToggles,
  setCachedToggles,
  hoveredResizeEdge,
  onEdgeHover,
  onResizeStart,
}) => {
  const themeTabContent = (
    <MobileThemeTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      applyThemeColors={applyThemeColors}
      prevThemeFamilyRef={prevThemeFamilyRef}
      getDefaultLandscapeId={() => undefined}
      colorPalettes={colorPalettes}
      activePaletteId={activePaletteId}
      onPaletteChange={onPaletteChange}
      onTextColorPresetChange={onTextColorPresetChange}
    />
  );

  const backgroundTabContent = (
    <MobileBackgroundTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      landscapes={landscapes}
      portraits={portraits}
      isBackgroundsLoading={isBackgroundsLoading}
      backgroundsError={!!backgroundsError}
      showBackgroundColorPicker={showBackgroundColorPicker}
      setShowBackgroundColorPicker={setShowBackgroundColorPicker}
      setShowBackgroundGallery={setShowBackgroundGallery}
    />
  );

  const scaleTabContent = (
    <MobileScaleTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
    />
  );

  const fontTabContent = (
    <MobileFontTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      availableFonts={availableFonts}
      fontPairs={fontPairs}
      selectedFontPairId={selectedFontPairId}
      setSelectedFontPairId={setSelectedFontPairId}
      applyFontPair={applyFontPair}
      openTextColorPicker={openTextColorPicker}
      setOpenTextColorPicker={setOpenTextColorPicker}
    />
  );

  const contentTabContent = (
    <MobileContentTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      cachedToggles={cachedToggles}
      setCachedToggles={setCachedToggles}
    />
  );

  const colorTabContent = (
    <MobileColorTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      selectedEvent={selectedEvent}
      eventColors={themeColors}
      defaultEventColors={themeColors}
      handleColorChange={handleColorSelect}
      applyColorToAll={applyColorToAll}
      setApplyColorToAll={setApplyColorToAll}
      themeColors={themeColors}
      currentPalette={currentPalette}
      showPalettePicker={showPalettePicker}
      setShowPalettePicker={setShowPalettePicker}
      setActivePaletteId={setActivePaletteId}
      events={events}
      onUpdateEvents={onUpdateEvents}
      shuffleColorsForEvents={shuffleColorsForEvents}
      triggerColorUpdate={triggerColorUpdate}
      setShowFontSelector={setShowFontSelector}
    />
  );

  const headerTabContent = (
    <MobileHeaderTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      openTextColorPicker={openTextColorPicker}
      setOpenTextColorPicker={setOpenTextColorPicker}
    />
  );

  const timeTabContent = (
    <MobileTimeTab
      template={template}
      onUpdateTemplate={onUpdateTemplate}
      openTextColorPicker={openTextColorPicker}
      setOpenTextColorPicker={setOpenTextColorPicker}
    />
  );

  // Mobile tabs configuration - dynamic based on selection
  const mobileExportTabs: MobileTab[] = selectedEventId ? [
    // When an event is selected, show color tab
    {
      id: 'color',
      label: 'Color',
      icon: <Droplet size={16} />,
      content: colorTabContent,
    },
  ] : selectedComponent === 'dayHeader' ? [
    // When header is selected, show header tab
    {
      id: 'header',
      label: 'Header',
      icon: <Layout size={16} />,
      content: headerTabContent,
    },
  ] : selectedComponent === 'timeColumn' ? [
    // When time column is selected, show time tab
    {
      id: 'time',
      label: 'Time',
      icon: <Clock size={16} />,
      content: timeTabContent,
    },
  ] : [
    // Default tabs
    {
      id: 'theme',
      label: 'Theme',
      icon: <Palette size={16} />,
      content: themeTabContent,
    },
    {
      id: 'background',
      label: 'BG',
      icon: <Image size={16} />,
      content: backgroundTabContent,
    },
    {
      id: 'scale',
      label: 'Scale',
      icon: <Maximize2 size={16} />,
      content: scaleTabContent,
    },
    {
      id: 'font',
      label: 'Font',
      icon: <Type size={16} />,
      content: fontTabContent,
    },
    {
      id: 'content',
      label: 'Content',
      icon: <Layout size={16} />,
      content: contentTabContent,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <MobileHeaderBar
        left={
          <button onClick={onBack} className={headerGhostBtnClass} style={{ backgroundColor: 'var(--button-ghost)' }}>
            ← Back
          </button>
        }
        title="Visual Style"
        right={
          <button onClick={handleDownload} disabled={isExporting} className={headerAccentBtnClass}>
            <Download size={11} />
            {isExporting ? '...' : 'Download'}
          </button>
        }
      />

      {/* Preview Panel with zoom controls */}
      <div className="flex-1 min-h-0 relative mb-[56px]">
        <MobileExportZoomToolbar
          isZoomToolbarOpen={isZoomToolbarOpen}
          setIsZoomToolbarOpen={setIsZoomToolbarOpen}
          zoom={zoom}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleZoomReset={handleZoomReset}
        />

        <MobilePreviewPanel
          events={events}
          template={template}
          supportsZoom={supportsZoom}
          zoom={zoom}
          canvasDimensions={canvasDimensions}
          previewPanelRef={previewPanelRef}
          colorPickerRef={colorPickerRef}
          handleBlankClick={handleBlankClick}
          handleEventClick={handleEventClick}
          selectedComponent={selectedComponent}
          setSelectedComponent={setSelectedComponent}
          setSelectedEventId={setSelectedEventId}
          setMobileActiveTab={setMobileActiveTab}
          onboardingPending={onboardingPending}
          onboardingEventId={onboardingEventId}
          handleOnboardingOk={handleOnboardingOk}
          setCanvasDimensions={setCanvasDimensions}
          hoveredResizeEdge={hoveredResizeEdge}
          onEdgeHover={onEdgeHover}
          onResizeStart={onResizeStart}
          isToolPanelOpen={!!mobileActiveTab}
        />
      </div>

      {/* Hidden export canvas */}
      <div
        style={{
          position: 'fixed',
          left: isExporting ? '0' : '-9999px',
          top: isExporting ? '0' : '-9999px',
          zIndex: isExporting ? -1 : -9999,
          pointerEvents: 'none',
          visibility: isExporting ? 'visible' : 'hidden',
        }}
      >
        <div id="calendar-export-hidden">
          <CalendarCanvas
            events={events}
            template={template}
            interactive={false}
            showFullTitle={template.showCourseSection}
          />
        </div>
      </div>

      {/* Mobile Footer Toolbar */}
      <MobileFooterToolbar
        tabs={mobileExportTabs}
        activeTabId={mobileActiveTab}
        onTabChange={setMobileActiveTab}
        onPanelClose={() => {
          // Deselect elements when closing/collapsing the panel
          if (selectedEventId) {
            setSelectedEventId(null);
          }
          if (selectedComponent !== 'none') {
            setSelectedComponent('none');
          }
        }}
      />

      {/* Background Gallery Modal */}
      {showBackgroundGallery && (
        <MobileBackgroundGalleryModal
          template={template}
          onUpdateTemplate={onUpdateTemplate}
          landscapes={landscapes}
          portraits={portraits}
          onClose={() => setShowBackgroundGallery(false)}
        />
      )}
    </div>
  );
};
