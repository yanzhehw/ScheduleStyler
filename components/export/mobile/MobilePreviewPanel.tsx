import React from 'react';
import { CalendarEvent, TemplateConfig, SelectableExportComponent, OnboardingComponent, ResizeEdge } from '../../../types';
import { CalendarCanvas } from '../../CalendarCanvas';

// Import lockscreen mockup overlay (webp with png fallback)
import lockscreenMockupWebp from '../../../assets/backgrounds/lock-screen-mockup.webp';
import lockscreenMockupPng from '../../../assets/backgrounds/lock-screen-mockup.png';

interface MobilePreviewPanelProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  supportsZoom: boolean;
  zoom: number;
  canvasDimensions: { width: number; height: number; minCardWidth: number; minCardHeight: number };
  previewPanelRef: React.RefObject<HTMLDivElement>;
  colorPickerRef: React.RefObject<HTMLDivElement>;
  handleBlankClick: () => void;
  handleEventClick: (event: CalendarEvent) => void;
  selectedComponent: SelectableExportComponent;
  setSelectedComponent: (component: SelectableExportComponent) => void;
  setSelectedEventId: (id: string | null) => void;
  setMobileActiveTab: (tab: string | null) => void;
  onboardingPending: {
    calendarCard: boolean;
    dayHeader: boolean;
    timeColumn: boolean;
    eventBlock: boolean;
  };
  onboardingEventId: string | null;
  handleOnboardingOk: (component: OnboardingComponent) => void;
  setCanvasDimensions: (dims: { width: number; height: number; minCardWidth: number; minCardHeight: number }) => void;
  hoveredResizeEdge: ResizeEdge;
  onEdgeHover: (edge: ResizeEdge) => void;
  onResizeStart: (edge: ResizeEdge, mousePos: { x: number; y: number }) => void;
  /** Whether a tool panel is currently open, to add extra scroll padding */
  isToolPanelOpen?: boolean;
}

export const MobilePreviewPanel: React.FC<MobilePreviewPanelProps> = ({
  events,
  template,
  supportsZoom,
  zoom,
  canvasDimensions,
  previewPanelRef,
  colorPickerRef,
  handleBlankClick,
  handleEventClick,
  selectedComponent,
  setSelectedComponent,
  setSelectedEventId,
  setMobileActiveTab,
  onboardingPending,
  onboardingEventId,
  handleOnboardingOk,
  setCanvasDimensions,
  hoveredResizeEdge,
  onEdgeHover,
  onResizeStart,
  isToolPanelOpen,
}) => {
  return (
    <div
      data-component="MobilePreviewPanel"
      ref={previewPanelRef}
      className="absolute inset-0 overflow-auto"
      style={{ touchAction: selectedComponent === 'calendarCard' ? 'none' : 'pan-x pan-y' }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (colorPickerRef.current?.contains(target)) return;
        if (target.closest('[data-component="EventBlock"]') ||
            target.closest('[data-component="DayHeader"]') ||
            target.closest('[data-component="TimeColumn"]') ||
            target.closest('[data-component="DayColumn"]') ||
            target.closest('[data-component="CalendarCard"]') ||
            target.closest('[data-component^="ResizeEdge"]')) return;
        handleBlankClick();
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (colorPickerRef.current?.contains(target)) return;
        // Only trigger blank click if tapping on the panel itself, not on interactive elements
        if (target.closest('[data-component="EventBlock"]') ||
            target.closest('[data-component="DayHeader"]') ||
            target.closest('[data-component="TimeColumn"]') ||
            target.closest('[data-component="DayColumn"]') ||
            target.closest('[data-component="CalendarCard"]') ||
            target.closest('[data-component^="ResizeEdge"]')) return;
        const touch = e.changedTouches[0];
        const cardEl = previewPanelRef.current?.querySelector('[data-component="CalendarCard"]') as HTMLElement | null;
        if (cardEl && touch) {
          const rect = cardEl.getBoundingClientRect();
          const insideCard = touch.clientX >= rect.left && touch.clientX <= rect.right
            && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
          if (insideCard) {
            setSelectedComponent('calendarCard');
            setSelectedEventId(null);
            setMobileActiveTab('scale');
            return;
          }
        }
        handleBlankClick();
      }}
    >
      {/* Scale spacer - provides scrollable area for transform scale */}
      <div
        className="min-h-full p-4 flex items-start justify-center"
        style={{
          minWidth: canvasDimensions.width * zoom + 32,
          minHeight: canvasDimensions.height * zoom + 32,
          width: '100%',
          paddingBottom: isToolPanelOpen ? '50vh' : undefined,
        }}
      >
        <div
          className="transition-all duration-200"
          style={{
            width: canvasDimensions.width,
            height: canvasDimensions.height,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            // Collapse unused space when scale < 1 so layout matches visual size
            marginBottom: zoom < 1 ? -(canvasDimensions.height * (1 - zoom)) : undefined,
          } as React.CSSProperties}
        >
          {template.lockscreenMockup ? (
            <div data-component="LockscreenMockup" className="relative">
              <div
                id="calendar-export-node"
                className="relative z-40"
                style={{ borderRadius: '8%' }}
              >
                <CalendarCanvas
                  events={events}
                  template={template}
                  interactive={true}
                  onEventClick={handleEventClick}
                  onBlankClick={handleBlankClick}
                  visualScale={zoom}
                  showFullTitle={template.showCourseSection}
                  mockupClipBorderRadius="8%"
                  mockupOverlay={
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        width: `${(3772 / 3345) * 100}%`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 30,
                      }}
                    >
                      <picture>
                        <source srcSet={lockscreenMockupWebp} type="image/webp" />
                        <img
                          src={lockscreenMockupPng}
                          alt="iPhone Lockscreen Frame"
                          className="w-full h-auto"
                        />
                      </picture>
                    </div>
                  }
                  onHeaderClick={() => {
                    setSelectedEventId(null);
                    setSelectedComponent('dayHeader');
                    setMobileActiveTab('header');
                  }}
                  onTimeColumnClick={() => {
                    setSelectedEventId(null);
                    setSelectedComponent('timeColumn');
                    setMobileActiveTab('time');
                  }}
                  isCalendarCardSelected={selectedComponent === 'calendarCard'}
                  onCalendarCardSelect={() => {
                    setSelectedComponent('calendarCard');
                    setSelectedEventId(null);
                    setMobileActiveTab('scale');
                  }}
                  highlightMode={selectedComponent}
                  hoveredResizeEdge={hoveredResizeEdge}
                  onEdgeHover={onEdgeHover}
                  onResizeStart={onResizeStart}
                  onboardingComponents={onboardingPending}
                  onboardingEventId={onboardingEventId}
                  onOnboardingOk={handleOnboardingOk}
                  onDimensionsComputed={setCanvasDimensions}
                />
              </div>
            </div>
          ) : (
            <div id="calendar-export-node">
              <CalendarCanvas
                events={events}
                template={template}
                interactive={true}
                onEventClick={handleEventClick}
                onBlankClick={handleBlankClick}
                visualScale={zoom}
                showFullTitle={template.showCourseSection}
                onHeaderClick={() => {
                  setSelectedEventId(null);
                  setSelectedComponent('dayHeader');
                  setMobileActiveTab('header');
                }}
                onTimeColumnClick={() => {
                  setSelectedEventId(null);
                  setSelectedComponent('timeColumn');
                  setMobileActiveTab('time');
                }}
                isCalendarCardSelected={selectedComponent === 'calendarCard'}
                onCalendarCardSelect={() => {
                  setSelectedComponent('calendarCard');
                  setSelectedEventId(null);
                  setMobileActiveTab('scale');
                }}
                highlightMode={selectedComponent}
                hoveredResizeEdge={hoveredResizeEdge}
                onEdgeHover={onEdgeHover}
                onResizeStart={onResizeStart}
                onboardingComponents={onboardingPending}
                onboardingEventId={onboardingEventId}
                onOnboardingOk={handleOnboardingOk}
                onDimensionsComputed={setCanvasDimensions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
