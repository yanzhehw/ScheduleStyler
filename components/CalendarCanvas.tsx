import React, { useMemo, useRef, useEffect, useState } from 'react';
import { CalendarEvent, TemplateConfig } from '../types';
import { MapPin, AlignLeft } from 'lucide-react';

interface CalendarCanvasProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onEventClick?: (event: CalendarEvent) => void;
  onBlankClick?: () => void;
  interactive?: boolean;
  id?: string;
  showFullTitle?: boolean;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Round time value (in hours) to the nearest half hour for grid alignment
const roundToNearestHalfHour = (timeInHours: number): number => {
  return Math.round(timeInHours * 2) / 2;
};

// Calculate minimum height needed for an event's content in pixels
const calculateMinEventHeight = (
  event: CalendarEvent,
  template: TemplateConfig,
  showFullTitle: boolean
): number => {
  const baseFontSize = template.fontScale * 12; // 0.75rem = 12px base
  const smallFontSize = template.fontScale * 9.6; // 0.6rem = 9.6px base
  const lineHeight = 1.4;
  
  let totalHeight = 16; // Base padding (p-2 = 8px top + 8px bottom)
  
  // Title height
  const title = showFullTitle ? event.title : event.displayTitle;
  const titleLines = Math.ceil(title.length / 12); // Rough estimate of line wrapping
  totalHeight += baseFontSize * lineHeight * Math.min(titleLines, 2);
  
  // Class type height
  if (template.showClassType) {
    totalHeight += smallFontSize * lineHeight + 4; // +4 for mb-1
  }
  
  if (!template.compact) {
    // Time height
    if (template.showTime) {
      totalHeight += smallFontSize * lineHeight + 2;
    }
    
    // Location height
    if (template.showLocation && event.location) {
      totalHeight += smallFontSize * lineHeight + 2;
    }
    
    // Notes height (estimate 2 lines max for calculation)
    if ((event.includeNotes ?? template.showNotes) && event.notes) {
      totalHeight += smallFontSize * lineHeight * 2 + 8; // +8 for margin/border
    }
  }
  
  return totalHeight;
};

export const CalendarCanvas: React.FC<CalendarCanvasProps> = ({
  events,
  template,
  onEventClick,
  onBlankClick,
  interactive = false,
  id,
  showFullTitle = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const visibleDays = useMemo(() => {
    const hasWeekendEvents = events.some(e => e.dayIndex >= 5);
    return hasWeekendEvents ? ALL_DAYS : ALL_DAYS.slice(0, 5);
  }, [events]);

  // Dynamic Time Range Calculation
  const { startHour, hourRange, hours } = useMemo(() => {
    if (events.length === 0) {
      return { startHour: 8, hourRange: 10, hours: Array.from({ length: 10 }, (_, i) => i + 8) };
    }

    let minH = 24;
    let maxH = 0;
    
    events.forEach(e => {
      const [sH] = e.startTime.split(':').map(Number);
      const [eH, eM] = e.endTime.split(':').map(Number);
      const effectiveEnd = eM > 0 ? eH + 1 : eH;
      
      if (sH < minH) minH = sH;
      if (effectiveEnd > maxH) maxH = effectiveEnd;
    });

    maxH = Math.min(24, maxH + 1);
    
    if (maxH - minH < 4) {
      maxH = Math.min(24, minH + 4);
      if (maxH - minH < 4) minH = Math.max(0, maxH - 4);
    }
    
    const range = maxH - minH;
    const h = Array.from({ length: range }, (_, i) => i + minH);
    
    return { startHour: minH, hourRange: range, hours: h };
  }, [events]);

  // Calculate dynamic hour height based on content that needs to fit
  const hourHeight = useMemo(() => {
    const baseHourHeight = 60; // Base height per hour in pixels
    
    if (events.length === 0) return baseHourHeight;
    
    let maxRequiredHourHeight = baseHourHeight;
    
    events.forEach(event => {
      const minContentHeight = calculateMinEventHeight(event, template, showFullTitle);
      
      // Calculate event duration using aligned times (same as rendering)
      const startVal = parseInt(event.startTime.split(':')[0]) + parseInt(event.startTime.split(':')[1]) / 60;
      const endVal = parseInt(event.endTime.split(':')[0]) + parseInt(event.endTime.split(':')[1]) / 60;
      const alignedStart = roundToNearestHalfHour(startVal);
      const alignedEnd = roundToNearestHalfHour(endVal);
      const durationHours = Math.max(0.5, alignedEnd - alignedStart);
      
      // Calculate what hourHeight would give us enough space for this event
      // eventHeight = durationHours * hourHeight
      // We need: eventHeight >= minContentHeight
      // So: hourHeight >= minContentHeight / durationHours
      const requiredHourHeight = minContentHeight / durationHours;
      
      maxRequiredHourHeight = Math.max(maxRequiredHourHeight, requiredHourHeight);
    });
    
    // Apply reasonable bounds
    return Math.max(baseHourHeight, Math.min(maxRequiredHourHeight, 200));
  }, [events, template, showFullTitle]);

  // Calculate canvas dimensions based on aspect ratio
  // aspectRatio: 0 = landscape (16:9), 1 = portrait (9:16)
  const canvasDimensions = useMemo(() => {
    const headerHeight = 40;
    const footerHeight = 40;
    const gridPadding = 64; // p-8
    const gridHeight = hourRange * hourHeight;
    const baseHeight = gridHeight + headerHeight + footerHeight + gridPadding;
    
    // Use aspect ratio to control the height multiplier smoothly
    // 0 (landscape) = 1x, 1 (portrait) = 1.8x
    const heightMultiplier = 1 + template.aspectRatio * 0.8;
    
    return {
      minHeight: baseHeight * heightMultiplier,
      gridHeight: gridHeight * heightMultiplier
    };
  }, [template.aspectRatio, hourRange, hourHeight]);

  // Theme styles
  const themeClasses = useMemo(() => {
    // Handle both legacy single theme strings and new structured theme format
    const themeId = template.theme;
    const variant = template.themeVariant;
    const family = template.themeFamily;
    
    // Check if it's glass family
    if (themeId?.includes('glass') || family === 'glass') {
      return 'bg-white/10 backdrop-blur-xl text-white border-white/20';
    }
    
    // Check variant for light/dark
    if (variant === 'light' || themeId === 'light' || themeId?.includes('light')) {
      return 'bg-white text-gray-900 border-gray-200';
    }
    
    // Default to dark
    return 'bg-gray-900 text-gray-100 border-gray-700';
  }, [template.theme, template.themeVariant, template.themeFamily]);

  const gridBorderColor = useMemo(() => {
    const variant = template.themeVariant;
    const themeId = template.theme;
    return (variant === 'light' || themeId === 'light' || themeId?.includes('light')) 
      ? 'border-gray-100' 
      : 'border-gray-800';
  }, [template.theme, template.themeVariant]);

  const hourTextColor = useMemo(() => {
    const variant = template.themeVariant;
    const themeId = template.theme;
    return (variant === 'light' || themeId === 'light' || themeId?.includes('light'))
      ? 'text-gray-400'
      : 'text-gray-500';
  }, [template.theme, template.themeVariant]);

  return (
    // CALENDAR CARD - The main calendar container with theme styling
    <div
      data-component="CalendarCard"
      ref={containerRef}
      id={id}
      className={`w-full flex flex-col p-8 ${themeClasses} transition-all duration-300 rounded-xl shadow-2xl relative`}
      style={{
        borderRadius: template.borderRadius,
        height: `${canvasDimensions.minHeight}px`,
      }}
    >

      {/* CALENDAR CONTENT - Wrapper for header + grid */}
      <div 
        data-component="CalendarContent"
      >
        {/* DAY HEADER - Shows MON TUE WED THU FRI (SAT SUN if needed) */}
        <div data-component="DayHeader" className="flex mb-4">
          <div className="w-12 shrink-0"></div>
          <div
            className="flex-1 grid"
            style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
          >
            {visibleDays.map((day) => (
              <div key={day} className="text-center font-semibold tracking-wider uppercase text-sm opacity-80">
                {day}
              </div>
            ))}
          </div>
        </div>

      {/* SCHEDULE GRID - The main time grid with events */}
      <div data-component="ScheduleGrid" className="flex relative isolate" style={{ height: `${canvasDimensions.gridHeight}px` }}>
        {/* TIME COLUMN - Shows 8:00, 9:00, etc. */}
        <div data-component="TimeColumn" className="w-12 flex flex-col text-xs font-mono pr-2 items-end relative z-10 shrink-0">
          {hours.map((hour) => (
            <div key={hour} style={{ height: `${canvasDimensions.gridHeight / hourRange}px` }} className={`-mt-2.5 ${hourTextColor}`}>
              {hour}:00
            </div>
          ))}
        </div>

        {/* DAY COLUMNS CONTAINER - Contains grid lines and event blocks */}
        <div
          data-component="DayColumnsContainer"
          className="flex-1 grid relative"
          style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
        >
          {/* GRID LINES - Horizontal hour separator lines */}
          <div data-component="GridLines" className="absolute inset-0 z-0 flex flex-col pointer-events-none">
            {hours.map((hour) => (
              <div key={hour} style={{ height: `${canvasDimensions.gridHeight / hourRange}px` }} className={`w-full ${template.showGrid ? `border-t ${gridBorderColor}` : ''}`}></div>
            ))}
          </div>

          {/* DAY COLUMN - Individual day column containing events */}
          {visibleDays.map((_, dayIndex) => (
            <div
              data-component="DayColumn"
              key={dayIndex}
              className={`col-span-1 relative ${dayIndex < visibleDays.length - 1 && template.showGrid ? `border-r ${gridBorderColor}` : ''}`}
              style={{ height: `${canvasDimensions.gridHeight}px` }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              if (interactive && onBlankClick && e.target === e.currentTarget) {
                onBlankClick();
              }
            }}
          >
            {events.filter(e => e.dayIndex === dayIndex).map(event => {
              
              // Original time values
              const startVal = parseInt(event.startTime.split(':')[0]) + parseInt(event.startTime.split(':')[1])/60;
              const endVal = parseInt(event.endTime.split(':')[0]) + parseInt(event.endTime.split(':')[1])/60;
              
              // Round to nearest half hour for grid alignment
              const alignedStart = roundToNearestHalfHour(startVal);
              const alignedEnd = roundToNearestHalfHour(endVal);
              
              // Ensure minimum height of 0.5 hours even after rounding
              const alignedDuration = Math.max(0.5, alignedEnd - alignedStart);

              const topPercent = ((alignedStart - startHour) / hourRange) * 100;
              const heightPercent = (alignedDuration / hourRange) * 100;

              return (
                // EVENT BLOCK - Individual class/event card
                <div
                  data-component="EventBlock"
                  key={event.id}
                  onClick={() => interactive && onEventClick && onEventClick(event)}
                  className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm border
                    flex flex-col
                    ${interactive ? 'cursor-pointer hover:brightness-110 hover:shadow-md hover:z-50 transition-all' : ''}
                    ${event.isConfidenceLow && interactive ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                  `}
                  style={{
                    top: `${topPercent}%`,
                    height: `${heightPercent}%`,
                    backgroundColor: event.color + ((template.themeFamily === 'glass' || template.theme?.includes('glass')) ? '90' : ''),
                    borderColor: 'rgba(0,0,0,0.1)',
                    color: '#fff',
                    zIndex: 10,
                  }}
                >
                  <div className="flex flex-col min-w-0 overflow-hidden gap-0">
                    <div
                      className="font-bold leading-none uppercase tracking-wide break-words"
                      style={{ fontSize: `${template.fontScale * 0.75}rem`, color: '#1f2937' }}
                      title={showFullTitle ? event.title : event.displayTitle}
                    >
                      {showFullTitle ? event.title : event.displayTitle}
                    </div>

                    {/* Class Type Label */}
                    {template.showClassType && (
                      <div
                        className="font-semibold opacity-90"
                        style={{ fontSize: `${template.fontScale * 0.6}rem`, color: '#1f2937', marginTop: '2px' }}
                      >
                        {event.classType === 'Custom' ? event.customClassType : event.classType}
                      </div>
                    )}
                  </div>

                  {!template.compact && (
                    <div
                      className="opacity-90 flex flex-col gap-0 min-w-0 overflow-hidden"
                      style={{ fontSize: `${template.fontScale * 0.6}rem`, color: '#374151', marginTop: '2px' }}
                    >
                      {template.showTime && (
                        <div className="flex items-center gap-1 font-mono opacity-80">
                           <span>{event.startTime} - {event.endTime}</span>
                        </div>
                      )}
                      
                      {template.showLocation && event.location && (
                        <div className="flex items-start gap-1 opacity-75">
                          <MapPin size={10} className="mt-0.5 shrink-0" /> 
                          <span className="break-words">{event.location}</span>
                        </div>
                      )}
                      
                      {(event.includeNotes ?? template.showNotes) && event.notes && (
                         <div className="flex items-start gap-1 opacity-75 border-t border-black/10" style={{ marginTop: '2px', paddingTop: '2px' }}>
                           <AlignLeft size={10} className="mt-0.5 shrink-0" />
                           <span className="line-clamp-4 leading-tight break-words">{event.notes}</span>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>

        {/* CALENDAR FOOTER - Branding watermark */}
        <div data-component="CalendarFooter" className="mt-4 flex justify-center items-center opacity-50 text-xs">
          <span>Generated by ScheduleStyler</span>
        </div>
      </div>
    </div>
  );
};
