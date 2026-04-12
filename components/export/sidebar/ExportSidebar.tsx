import React from 'react';
import { Palette, Image, Maximize2, Type, Layout, Grid, ChevronRight, Download } from 'lucide-react';
import { GlowButton } from '../../ui/glow-button';
import { ThemeSection } from './ThemeSection';
import { FontSection } from './FontSection';
import { BackgroundSection } from './BackgroundSection';
import { ScaleSection } from './ScaleSection';
import { LayoutSection } from './LayoutSection';
import { GridSection } from './GridSection';
import { SidebarSection, ThemeSectionProps, FontSectionProps, BackgroundSectionProps, ScaleSectionProps, LayoutSectionProps, GridSectionProps } from './types';

export interface ExportSidebarProps {
  // Sidebar state
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeSidebarSection: SidebarSection;
  setActiveSidebarSection: (section: SidebarSection) => void;

  // Theme section props
  themeProps: ThemeSectionProps;

  // Font section props
  fontProps: FontSectionProps;

  // Background section props
  backgroundProps: BackgroundSectionProps;

  // Scale section props
  scaleProps: ScaleSectionProps & {
    setSelectedComponent: (component: string) => void;
    setHeaderTextEditorOpen: (open: boolean) => void;
    setTimeColumnEditorOpen: (open: boolean) => void;
    setSelectedEventId: (id: string | null) => void;
    setColorPickerPosition: (pos: any) => void;
  };

  // Layout section props
  layoutProps: LayoutSectionProps & {
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
  };

  // Grid section props
  gridProps: GridSectionProps;

  // Download
  isExporting: boolean;
  onDownload: () => void;
}

const SIDEBAR_SECTIONS = [
  { id: 'theme' as const, icon: <Palette size={18} />, label: 'Theme' },
  { id: 'background' as const, icon: <Image size={18} />, label: 'Background' },
  { id: 'scale' as const, icon: <Maximize2 size={18} />, label: 'Scale & Ratio' },
  { id: 'font' as const, icon: <Type size={18} />, label: 'Font' },
  { id: 'layout' as const, icon: <Layout size={18} />, label: 'Layout' },
  { id: 'grid' as const, icon: <Grid size={18} />, label: 'Grid' },
];

const SECTION_TITLES: Record<SidebarSection, string> = {
  theme: 'Theme',
  font: 'Font & Text',
  background: 'Background',
  scale: 'Scale & Ratio',
  layout: 'Layout',
  grid: 'Grid',
};

export const ExportSidebar: React.FC<ExportSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeSidebarSection,
  setActiveSidebarSection,
  themeProps,
  fontProps,
  backgroundProps,
  scaleProps,
  layoutProps,
  gridProps,
  isExporting,
  onDownload,
}) => {
  return (
    <div
      data-component="ExportSidebar"
      className={`
        min-h-0 overflow-hidden border-l flex transition-all duration-500
        ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 border-0 p-0'}
      `}
      style={{
        backgroundColor: 'var(--panel-background)',
        borderColor: 'var(--panel-border)',
        transitionTimingFunction: 'cubic-bezier(0.25, 1.1, 0.4, 1)',
      }}
    >
      {/* ICON NAVIGATION RAIL */}
      <div
        className="flex flex-col items-center py-4 px-2 gap-2 border-r"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        {SIDEBAR_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSidebarSection(section.id)}
            className="flex items-center justify-center rounded-lg size-10 min-w-10 transition-all duration-300"
            style={{
              backgroundColor: activeSidebarSection === section.id ? 'var(--surface-elevated)' : 'transparent',
              color: activeSidebarSection === section.id ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              if (activeSidebarSection !== section.id) {
                e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSidebarSection !== section.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
            title={section.label}
          >
            {section.icon}
          </button>
        ))}
      </div>

      {/* SIDEBAR CONTENT PANEL */}
      <div className="flex flex-col w-64 min-w-60">
        {/* SIDEBAR HEADER */}
        <div
          data-component="SidebarHeader"
          className="p-4 border-b flex items-center justify-between whitespace-nowrap"
          style={{ borderColor: 'var(--panel-border)', backgroundColor: 'var(--sidebar-header-bg)' }}
        >
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            {SECTION_TITLES[activeSidebarSection]}
          </h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-center rounded-lg size-8 transition-all duration-300"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Collapse sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* SIDEBAR CONTENT - Scrollable */}
        <div
          data-component="ExportSidebarContent"
          className="flex-1 h-0 overflow-y-auto custom-scrollbar"
        >
          <div className="p-4 space-y-6">
            {activeSidebarSection === 'theme' && (
              <ThemeSection {...themeProps} />
            )}

            {activeSidebarSection === 'font' && (
              <FontSection {...fontProps} />
            )}

            {activeSidebarSection === 'background' && (
              <BackgroundSection {...backgroundProps} />
            )}

            {activeSidebarSection === 'scale' && (
              <ScaleSection
                {...scaleProps}
              />
            )}

            {activeSidebarSection === 'layout' && (
              <LayoutSection
                {...layoutProps}
              />
            )}

            {activeSidebarSection === 'grid' && (
              <GridSection {...gridProps} />
            )}
          </div>
        </div>

        {/* Download Button - Fixed at bottom */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--panel-border)' }}>
          <GlowButton
            onClick={onDownload}
            disabled={isExporting}
            label={isExporting ? 'Exporting...' : 'Download'}
            className="w-full"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Download'}
          </GlowButton>
        </div>
      </div>
    </div>
  );
};
