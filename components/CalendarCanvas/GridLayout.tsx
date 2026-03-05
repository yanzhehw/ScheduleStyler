import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { TemplateConfig, SelectableExportComponent, OnboardingComponent } from '../../types';

export interface GridLayoutProps {
  template: TemplateConfig;
  visibleDays: string[];
  visibleDayIndices: number[];
  hours: number[];
  hourRange: number;
  cardDimensions: {
    gridWidth: number;
    gridHeight: number;
  };
  gridBorderColor: string;
  headerTextColor: string;
  blurScale: number;
  exportMode: boolean;
  interactive: boolean;
  hoveredComponent: SelectableExportComponent;
  highlightMode: 'none' | 'all' | SelectableExportComponent;
  showDayHeaderHighlight: boolean;
  showTimeColumnHighlight: boolean;
  isOnboardingActive: (component: OnboardingComponent) => boolean;
  onHeaderClick?: () => void;
  onTimeColumnClick?: () => void;
  setHoveredComponent: (c: SelectableExportComponent) => void;
  getHoveredComponentFromTarget: (target: HTMLElement | null) => SelectableExportComponent;
  dayColumnsRef: React.RefObject<HTMLDivElement>;
  handleGridMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onGridMouseLeave: () => void;
  onBlankClick?: () => void;
  textColorPreset: { timeColumnColor: string };
  /** Render prop: renders the content (EmptySlot + events) inside each day column */
  renderDayColumnContent: (actualDayIndex: number, colIndex: number) => React.ReactNode;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  template,
  visibleDays,
  visibleDayIndices,
  hours,
  hourRange,
  cardDimensions,
  gridBorderColor,
  headerTextColor,
  blurScale,
  exportMode,
  interactive,
  hoveredComponent,
  highlightMode,
  showDayHeaderHighlight,
  showTimeColumnHighlight,
  isOnboardingActive,
  onHeaderClick,
  onTimeColumnClick,
  setHoveredComponent,
  getHoveredComponentFromTarget,
  dayColumnsRef,
  handleGridMouseMove,
  onGridMouseLeave,
  onBlankClick,
  textColorPreset,
  renderDayColumnContent,
}) => {
  return (
    <>
      {/* DAY HEADER - Shows MON TUE WED THU FRI (SAT SUN if needed) */}
      <div data-component="DayHeader" className="flex mb-4 relative">
        <div className="w-12 shrink-0"></div>
        <div
          onClick={() => interactive && onHeaderClick && onHeaderClick()}
          onTouchEnd={(e: React.TouchEvent) => {
            if (interactive && onHeaderClick) {
              e.preventDefault();
              e.stopPropagation();
              onHeaderClick();
            }
          }}
          onMouseEnter={() => {
            if (interactive && onHeaderClick) {
              setHoveredComponent('dayHeader');
            }
          }}
          onMouseLeave={(e: React.MouseEvent) => {
            if (!interactive || !onHeaderClick) return;
            const relatedTarget = e.relatedTarget as HTMLElement | null;
            setHoveredComponent(getHoveredComponentFromTarget(relatedTarget));
          }}
          className={`flex-1 grid relative ${interactive && onHeaderClick ? 'cursor-pointer rounded-lg transition-all' : ''} ${
            interactive && onHeaderClick && hoveredComponent === 'dayHeader' && highlightMode === 'none'
              ? 'bg-white/10 ring-2 ring-blue-400/50'
              : ''
          }`}
          style={{
            gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
            ...(showDayHeaderHighlight ? {
              border: '3px dotted rgba(34, 197, 94, 0.6)',
              borderRadius: '10px',
              boxSizing: 'border-box',
            } : {}),
            // Apply blur to entire bar when mode is 'bar'
            ...(template.headerBlurAmount > 0 && template.headerBlurMode === 'bar' ? {
              position: 'relative' as const,
              zIndex: 1,
              // In export mode, use solid background instead of backdrop-filter
              ...(exportMode ? {
                // Export fallback: more opaque solid background
                backgroundColor: template.themeVariant === 'light'
                  ? `rgba(255,255,255,${0.3 + template.headerBlurAmount * 0.03})`
                  : `rgba(0,0,0,${0.2 + template.headerBlurAmount * 0.025})`,
              } : {
                backdropFilter: `blur(${template.headerBlurAmount * blurScale}px)`,
                WebkitBackdropFilter: `blur(${template.headerBlurAmount * blurScale}px)`,
                backgroundColor: template.themeVariant === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              }),
              borderRadius: '8px',
            } : {})
          }}
        >
          {visibleDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold tracking-wider uppercase text-sm opacity-80 py-1"
              style={{
                color: headerTextColor,
                // Apply blur to individual cells when mode is 'cells'
                ...(template.headerBlurAmount > 0 && template.headerBlurMode === 'cells' ? {
                  position: 'relative' as const,
                  zIndex: 1,
                  // In export mode, use solid background instead of backdrop-filter
                  ...(exportMode ? {
                    backgroundColor: template.themeVariant === 'light'
                      ? `rgba(255,255,255,${0.3 + template.headerBlurAmount * 0.03})`
                      : `rgba(0,0,0,${0.2 + template.headerBlurAmount * 0.025})`,
                  } : {
                    backdropFilter: `blur(${template.headerBlurAmount * blurScale}px)`,
                    WebkitBackdropFilter: `blur(${template.headerBlurAmount * blurScale}px)`,
                    backgroundColor: template.themeVariant === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                  }),
                  borderRadius: '6px',
                  margin: '0 2px',
                } : {})
              }}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Onboarding callout for day header - appears below */}
        {isOnboardingActive('dayHeader') && (
          <div
            data-component="OnboardingCallout-dayHeader"
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[200]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-0">
              {/* Arrow pointing up */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '8px solid rgba(34, 197, 94, 0.4)',
                }}
              />
              <div className="relative group bg-green-500/20 border border-green-500/35 rounded-lg p-2.5 text-xs text-green-200/90 backdrop-blur-md max-w-[350px]">
                <p className="break-words">
                  <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-green-400" />
                  Click to edit color + blur
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SCHEDULE GRID - The main time grid with events */}
      <div data-component="ScheduleGrid" className="flex relative isolate" style={{ height: `${cardDimensions.gridHeight}px` }}>
        {/* TIME COLUMN - Shows 8:00, 9:00, etc. */}
        <div
          data-component="TimeColumn"
          onClick={() => interactive && onTimeColumnClick && onTimeColumnClick()}
          onTouchEnd={(e: React.TouchEvent) => {
            if (interactive && onTimeColumnClick) {
              e.preventDefault();
              e.stopPropagation();
              onTimeColumnClick();
            }
          }}
          onMouseEnter={() => {
            if (interactive && onTimeColumnClick) {
              setHoveredComponent('timeColumn');
            }
          }}
          onMouseLeave={(e: React.MouseEvent) => {
            if (!interactive || !onTimeColumnClick) return;
            const relatedTarget = e.relatedTarget as HTMLElement | null;
            setHoveredComponent(getHoveredComponentFromTarget(relatedTarget));
          }}
          className={`w-12 flex flex-col text-xs font-mono pr-2 items-end relative z-10 shrink-0 ${interactive && onTimeColumnClick ? 'cursor-pointer rounded-lg transition-all' : ''} ${
            interactive && onTimeColumnClick && hoveredComponent === 'timeColumn' && highlightMode === 'none'
              ? 'bg-white/10 ring-2 ring-blue-400/50'
              : ''
          }`}
          style={{
            ...(showTimeColumnHighlight ? {
              border: '3px dotted rgba(245, 158, 11, 0.6)',
              borderRadius: '10px',
              boxSizing: 'border-box',
            } : {}),
            // Apply blur to entire column when mode is 'bar'
            ...(template.timeColumnBlurAmount > 0 && template.timeColumnBlurMode === 'bar' ? {
              position: 'relative' as const,
              // In export mode, use solid background instead of backdrop-filter
              ...(exportMode ? {
                backgroundColor: template.themeVariant === 'light'
                  ? `rgba(255,255,255,${0.3 + template.timeColumnBlurAmount * 0.03})`
                  : `rgba(0,0,0,${0.2 + template.timeColumnBlurAmount * 0.025})`,
              } : {
                backdropFilter: `blur(${template.timeColumnBlurAmount * blurScale}px)`,
                WebkitBackdropFilter: `blur(${template.timeColumnBlurAmount * blurScale}px)`,
                backgroundColor: template.themeVariant === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              }),
              borderRadius: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
            } : {})
          }}
        >
          {hours.map((hour) => {
            const isCellBlur = template.timeColumnBlurAmount > 0 && template.timeColumnBlurMode === 'cells';
            const labelBaseStyle: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              transform: 'translateY(-50%)',
              lineHeight: 1,
            };

            return (
              <div
                key={hour}
                style={{
                  height: `${cardDimensions.gridHeight / hourRange}px`,
                  color: template.timeColumnTextColor || textColorPreset.timeColumnColor,
                }}
              >
                {isCellBlur ? (
                  <span
                    style={{
                      ...labelBaseStyle,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      // In export mode, use solid background instead of backdrop-filter
                      ...(exportMode ? {
                        backgroundColor: template.themeVariant === 'light'
                          ? `rgba(255,255,255,${0.3 + template.timeColumnBlurAmount * 0.03})`
                          : `rgba(0,0,0,${0.2 + template.timeColumnBlurAmount * 0.025})`,
                      } : {
                        backdropFilter: `blur(${template.timeColumnBlurAmount * blurScale}px)`,
                        WebkitBackdropFilter: `blur(${template.timeColumnBlurAmount * blurScale}px)`,
                        backgroundColor: template.themeVariant === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                      }),
                    }}
                  >
                    {hour}:00
                  </span>
                ) : (
                  <span style={labelBaseStyle}>{hour}:00</span>
                )}
              </div>
            );
          })}
        </div>

        {/* DAY COLUMNS CONTAINER - Contains grid lines and event blocks */}
        <div
          data-component="DayColumnsContainer"
          className="flex-1 grid relative"
          style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
          ref={dayColumnsRef}
          onMouseMove={handleGridMouseMove}
          onMouseLeave={onGridMouseLeave}
        >
          {/* GRID LINES - Horizontal hour separator lines */}
          <div data-component="GridLines" className="absolute inset-0 z-0 flex flex-col pointer-events-none">
            {hours.map((hour) => (
              <div key={hour} style={{ height: `${cardDimensions.gridHeight / hourRange}px` }} className={`w-full ${template.showGrid ? `border-t ${gridBorderColor}` : ''}`}></div>
            ))}
          </div>

          {/* DAY COLUMN - Individual day column containing events */}
          {visibleDays.map((_, colIndex) => {
            const actualDayIndex = visibleDayIndices[colIndex];

            return (
              <div
                data-component="DayColumn"
                key={actualDayIndex}
                className={`col-span-1 relative ${colIndex < visibleDays.length - 1 && template.showGrid ? `border-r ${gridBorderColor}` : ''}`}
                style={{ height: `${cardDimensions.gridHeight}px` }}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  if (interactive && onBlankClick && e.target === e.currentTarget) {
                    onBlankClick();
                  }
                }}
                onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => {
                  if (interactive && onBlankClick && e.target === e.currentTarget) {
                    onBlankClick();
                  }
                }}
              >
                {renderDayColumnContent(actualDayIndex, colIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
