import React, { useMemo, useRef, useEffect, useState } from 'react';
import { CalendarEvent, TemplateConfig } from '../types';
import { MapPin, AlignLeft, Plus } from 'lucide-react';
import { getTheme } from '../themes';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';

interface CalendarCanvasProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onEventClick?: (event: CalendarEvent) => void;
  onBlankClick?: () => void;
  interactive?: boolean;
  id?: string;
  showFullTitle?: boolean;
  /** Callback to report computed dimensions to parent */
  onDimensionsComputed?: (dimensions: { width: number; height: number }) => void;
  /** Callback when day header is clicked */
  onHeaderClick?: () => void;
  /** Callback when time column is clicked */
  onTimeColumnClick?: () => void;
  /** Export mode - renders fallback backgrounds instead of backdrop-filter (for image export) */
  exportMode?: boolean;
  /** Selected event for highlighting and drag */
  selectedEventId?: string | null;
  /** Callback for drag updates */
  onEventTimeChange?: (eventId: string, updates: { startTime: string; endTime: string; dayIndex: number }) => void;
  /** Callback when clicking an empty hour slot */
  onEmptyBlockClick?: (slot: { dayIndex: number; startTime: string; endTime: string }) => void;
  /** Visual scale factor applied by the parent (used to keep blur consistent) */
  visualScale?: number;
  /** Hide borders for unselected events (used in edit view) */
  hideUnselectedBorders?: boolean;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// =============================================================================
// Dimension Constants & Utilities
// =============================================================================

/** Absolute minimum width per day column in pixels */
const ABSOLUTE_MIN_BLOCK_WIDTH = 60;

/** Fixed layout dimensions */
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 40;
const GRID_PADDING = 64; // p-8 = 32px * 2
const TIME_COLUMN_WIDTH = 48; // w-12 = 48px

/** Aspect ratio constants */
const LANDSCAPE_RATIO = 16 / 9;  // ~1.778 (slider = 0)
const PORTRAIT_RATIO = 9 / 16;   // ~0.5625 (slider = 1)

/** Event block internal padding (left-1 right-1 + p-1.5 = 4px + 6px each side) */
const EVENT_BLOCK_PADDING = 20;

/**
 * Calculate minimum width per column needed to keep text to max 2 lines.
 * 
 * Each field in the event block should wrap at most once (2 lines max).
 * Returns the minimum column width that satisfies this for the longest text.
 */
const calculateMinBlockWidth = (
  events: CalendarEvent[],
  template: TemplateConfig,
  showFullTitle: boolean
): number => {
  if (events.length === 0) return ABSOLUTE_MIN_BLOCK_WIDTH;
  
  // Average character widths at different font sizes (approximate)
  const titleFontSize = template.fontScale * 12; // 0.75rem = 12px base
  const detailFontSize = template.fontScale * 9.6; // 0.6rem = 9.6px base
  
  // Average char width is roughly 0.55x font size for proportional fonts
  const titleCharWidth = titleFontSize * 0.55;
  const detailCharWidth = detailFontSize * 0.55;
  
  let maxRequiredWidth = ABSOLUTE_MIN_BLOCK_WIDTH;
  
  events.forEach(event => {
    // Title text
    const title = showFullTitle ? event.title : event.displayTitle;
    // Width needed for title to fit in 2 lines: (chars * charWidth) / 2
    const titleWidth = (title.length * titleCharWidth) / 2;
    
    // Class type text
    let classTypeWidth = 0;
    if (template.showClassType) {
      const classTypeText = event.classType === 'Custom' ? (event.customClassType || '') : event.classType;
      classTypeWidth = (classTypeText.length * detailCharWidth) / 2;
    }
    
    // Location text
    let locationWidth = 0;
    if (template.showLocation && event.location && !template.compact) {
      // Account for icon width (~14px)
      locationWidth = ((event.location.length * detailCharWidth) / 2) + 14;
    }
    
    // Time is usually fixed length "HH:MM - HH:MM" = 13 chars, rarely wraps
    // Notes can be multi-line so we don't constrain based on notes
    
    // Required block width = max of all fields + padding
    const requiredWidth = Math.max(titleWidth, classTypeWidth, locationWidth) + EVENT_BLOCK_PADDING;
    maxRequiredWidth = Math.max(maxRequiredWidth, requiredWidth);
  });
  
  return maxRequiredWidth;
};

/**
 * Calculate canvas dimensions based on content and aspect ratio slider.
 * 
 * Slider range:
 * - 0 = 16:9 landscape
 * - 1 = 9:16 portrait
 * - Default (~0.6) = near natural content dimensions
 * 
 * Strategy:
 * - Calculate target aspect ratio from slider
 * - Try to achieve target by shrinking width (never shrink below minimum)
 * - If can't shrink width enough, expand height instead
 * - Minimum height = content-based (fits all text)
 * - Minimum width = dynamic based on text (max 2 line wrap per field)
 */
const calculateCanvasDimensions = (
  numDays: number,
  hourRange: number,
  contentBasedHourHeight: number,
  aspectRatioSlider: number, // 0 = 16:9 landscape, 1 = 9:16 portrait
  minBlockWidth: number // Dynamic minimum based on text content
): { width: number; height: number; gridWidth: number; gridHeight: number } => {
  // Minimum grid dimensions
  const minGridWidth = numDays * minBlockWidth;
  const minGridHeight = hourRange * contentBasedHourHeight;

  // Natural/default dimensions (what content needs)
  // Use the larger of: minimum based on text wrapping, or 120px per column
  const naturalGridWidth = Math.max(minGridWidth, numDays * 120);
  const naturalGridHeight = minGridHeight;

  // Total canvas dimensions (including chrome)
  const minCanvasWidth = minGridWidth + TIME_COLUMN_WIDTH + GRID_PADDING;
  const minCanvasHeight = minGridHeight + HEADER_HEIGHT + FOOTER_HEIGHT + GRID_PADDING;

  const naturalCanvasWidth = naturalGridWidth + TIME_COLUMN_WIDTH + GRID_PADDING;
  const naturalCanvasHeight = naturalGridHeight + HEADER_HEIGHT + FOOTER_HEIGHT + GRID_PADDING;

  // Calculate target ratio from slider (interpolate between 16:9 and 9:16)
  const targetRatio = LANDSCAPE_RATIO + (PORTRAIT_RATIO - LANDSCAPE_RATIO) * aspectRatioSlider;

  // Current natural ratio
  const naturalRatio = naturalCanvasWidth / naturalCanvasHeight;

  let finalWidth = naturalCanvasWidth;
  let finalHeight = naturalCanvasHeight;

  // Adjust dimensions to achieve target ratio
  if (targetRatio > naturalRatio) {
    // Target is wider than natural - expand width
    finalWidth = naturalCanvasHeight * targetRatio;
  } else if (targetRatio < naturalRatio) {
    // Target is narrower than natural - try shrinking width first
    const targetWidth = naturalCanvasHeight * targetRatio;
    
    if (targetWidth >= minCanvasWidth) {
      // Can achieve ratio by shrinking width
      finalWidth = targetWidth;
    } else {
      // Can't shrink width enough - expand height instead
      finalWidth = minCanvasWidth;
      finalHeight = minCanvasWidth / targetRatio;
    }
  }

  // Calculate grid dimensions from final canvas dimensions
  const finalGridWidth = finalWidth - TIME_COLUMN_WIDTH - GRID_PADDING;
  const finalGridHeight = finalHeight - HEADER_HEIGHT - FOOTER_HEIGHT - GRID_PADDING;

  return {
    width: finalWidth,
    height: finalHeight,
    gridWidth: finalGridWidth,
    gridHeight: finalGridHeight,
  };
};

// Round time value (in hours) to the nearest half hour for grid alignment
const roundToNearestHalfHour = (timeInHours: number): number => {
  return Math.round(timeInHours * 2) / 2;
};

const parseTimeToHours = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

const formatTimeFromHours = (timeInHours: number): string => {
  const clamped = Math.max(0, Math.min(24, timeInHours));
  const hours = Math.floor(clamped);
  const minutes = clamped - hours >= 0.5 ? 30 : 0;
  return `${hours.toString().padStart(2, '0')}:${minutes === 0 ? '00' : '30'}`;
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
  showFullTitle = false,
  onDimensionsComputed,
  onHeaderClick,
  onTimeColumnClick,
  exportMode = false,
  selectedEventId,
  onEventTimeChange,
  onEmptyBlockClick,
  visualScale,
  hideUnselectedBorders = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dayColumnsRef = useRef<HTMLDivElement>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ dayIndex: number; startHour: number } | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    eventId: string;
    durationHours: number;
    offsetY: number;
  } | null>(null);

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

  // Calculate minimum block width based on text content (max 2 line wrap per field)
  const minBlockWidth = useMemo(() => {
    return calculateMinBlockWidth(events, template, showFullTitle);
  }, [events, template, showFullTitle]);

  // Calculate canvas dimensions based on aspect ratio with minimum constraints
  // At slider=0 (landscape): 16:9, at slider=1 (portrait): 9:16
  const canvasDimensions = useMemo(() => {
    return calculateCanvasDimensions(
      visibleDays.length,
      hourRange,
      hourHeight,
      template.aspectRatio, // Pass slider value directly (0-1)
      minBlockWidth // Dynamic minimum based on text wrapping
    );
  }, [template.aspectRatio, visibleDays.length, hourRange, hourHeight, minBlockWidth]);

  // Report computed dimensions to parent (for ZoomWrapper sizing)
  useEffect(() => {
    if (onDimensionsComputed) {
      onDimensionsComputed({
        width: canvasDimensions.width,
        height: canvasDimensions.height
      });
    }
  }, [canvasDimensions.width, canvasDimensions.height, onDimensionsComputed]);

  // Get the current theme object
  const currentTheme = useMemo(() => {
    return getTheme(template.themeFamily, template.themeVariant);
  }, [template.themeFamily, template.themeVariant]);

  // Theme styles
  const themeClasses = useMemo(() => {
    // Handle both legacy single theme strings and new structured theme format
    const themeId = template.theme;
    const variant = template.themeVariant;
    const family = template.themeFamily;

    // For acrylic, we'll handle background via inline styles
    if (family === 'acrylic') {
      return variant === 'light'
        ? 'text-gray-900 border-gray-200'
        : 'text-gray-100 border-gray-700';
    }

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

  // Canvas inline styles for acrylic theme
  const canvasStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      borderRadius: template.borderRadius,
      width: `${canvasDimensions.width}px`,
      height: `${canvasDimensions.height}px`,
    };

    // Apply acrylic canvas background
    if (template.themeFamily === 'acrylic') {
      return {
        ...baseStyles,
        background: currentTheme.canvas.background,
        backgroundSize: currentTheme.canvas.backgroundSize || 'cover',
        backgroundPosition: currentTheme.canvas.backgroundPosition || 'center',
      };
    }

    return baseStyles;
  }, [template.borderRadius, template.themeFamily, canvasDimensions, currentTheme]);

  // Grid line color based on gridLineStyle setting (independent of theme variant)
  const gridBorderColor = useMemo(() => {
    return template.gridLineStyle === 'bright'
      ? 'border-gray-300'
      : 'border-gray-700';
  }, [template.gridLineStyle]);

  // Time column text color - use custom color or fall back to theme-based default
  const hourTextColor = useMemo(() => {
    if (template.timeColumnTextColor) {
      return ''; // Will use inline style instead
    }
    const variant = template.themeVariant;
    const themeId = template.theme;
    return (variant === 'light' || themeId === 'light' || themeId?.includes('light'))
      ? 'text-gray-400'
      : 'text-gray-500';
  }, [template.theme, template.themeVariant, template.timeColumnTextColor]);

  // Header text color - use custom color or fall back to theme-based default
  const headerTextColor = useMemo(() => {
    if (template.headerTextColor) {
      return template.headerTextColor;
    }
    const variant = template.themeVariant;
    const themeId = template.theme;
    return (variant === 'light' || themeId === 'light' || themeId?.includes('light'))
      ? '#111827'
      : '#f3f4f6';
  }, [template.theme, template.themeVariant, template.headerTextColor]);

  const effectiveScale = Math.max(0.25, visualScale ?? 1);
  const blurScale = 1 / effectiveScale;

  const isLightTheme = useMemo(() => {
    const variant = template.themeVariant;
    const themeId = template.theme;
    return variant === 'light' || themeId === 'light' || themeId?.includes('light');
  }, [template.theme, template.themeVariant]);

  const addSlotStyle = useMemo(() => {
    return {
      background: isLightTheme ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.4)',
      borderColor: isLightTheme ? 'rgba(148,163,184,0.65)' : 'rgba(148,163,184,0.25)',
      boxShadow: isLightTheme
        ? 'inset 3px 3px 8px rgba(0,0,0,0.12), inset -3px -3px 8px rgba(255,255,255,0.85), 0 8px 18px rgba(15,23,42,0.12)'
        : 'inset 4px 4px 10px rgba(0,0,0,0.55), inset -4px -4px 10px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.28)',
      transform: 'translateY(1px)',
    } as React.CSSProperties;
  }, [isLightTheme]);

  const addSlotTextColor = isLightTheme ? '#0f172a' : '#e2e8f0';
  const selectedBorderColor = isLightTheme ? 'rgba(37, 99, 235, 0.9)' : 'rgba(191, 219, 254, 0.95)';

  const isSlotEmpty = (dayIndex: number, slotStart: number): boolean => {
    const slotEnd = slotStart + 1;
    return !events.some((event) => {
      if (event.dayIndex !== dayIndex) return false;
      const startVal = parseTimeToHours(event.startTime);
      const endVal = parseTimeToHours(event.endTime);
      const alignedStart = roundToNearestHalfHour(startVal);
      const alignedEnd = roundToNearestHalfHour(endVal);
      const alignedDuration = Math.max(0.5, alignedEnd - alignedStart);
      const eventEnd = alignedStart + alignedDuration;
      return alignedStart < slotEnd && eventEnd > slotStart;
    });
  };

  useEffect(() => {
    if (!draggingEventId || !onEventTimeChange) return;

    const handleMove = (e: MouseEvent) => {
      const dragInfo = dragInfoRef.current;
      if (!dragInfo || !dayColumnsRef.current) return;

      const rect = dayColumnsRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - dragInfo.offsetY;
      const dayWidth = rect.width / visibleDays.length;
      const rawDayIndex = Math.floor(x / dayWidth);
      const nextDayIndex = Math.min(visibleDays.length - 1, Math.max(0, rawDayIndex));

      const hourHeightPx = rect.height / hourRange;
      const rawStart = startHour + y / hourHeightPx;
      const snappedStart = roundToNearestHalfHour(rawStart);
      const maxStart = startHour + hourRange - dragInfo.durationHours;
      const clampedStart = Math.min(maxStart, Math.max(startHour, snappedStart));
      const clampedEnd = clampedStart + dragInfo.durationHours;

      onEventTimeChange(dragInfo.eventId, {
        startTime: formatTimeFromHours(clampedStart),
        endTime: formatTimeFromHours(clampedEnd),
        dayIndex: nextDayIndex,
      });
    };

    const handleUp = () => {
      setDraggingEventId(null);
      dragInfoRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingEventId, onEventTimeChange, hourRange, startHour, visibleDays.length]);

  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onEmptyBlockClick || draggingEventId) return;
    if (!dayColumnsRef.current) return;

    const rect = dayColumnsRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      if (hoveredSlot) setHoveredSlot(null);
      return;
    }

    const dayWidth = rect.width / visibleDays.length;
    const dayIndex = Math.min(visibleDays.length - 1, Math.max(0, Math.floor(x / dayWidth)));
    const hourHeightPx = rect.height / hourRange;
    const rawHour = startHour + y / hourHeightPx;
    const slotStart = Math.min(startHour + hourRange - 1, Math.max(startHour, Math.floor(rawHour)));

    if (!isSlotEmpty(dayIndex, slotStart)) {
      if (hoveredSlot) setHoveredSlot(null);
      return;
    }

    if (!hoveredSlot || hoveredSlot.dayIndex !== dayIndex || hoveredSlot.startHour !== slotStart) {
      setHoveredSlot({ dayIndex, startHour: slotStart });
    }
  };

  const handleEventMouseDown = (event: CalendarEvent, e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onEventTimeChange || selectedEventId !== event.id) return;
    if (!dayColumnsRef.current) return;

    const startVal = parseTimeToHours(event.startTime);
    const endVal = parseTimeToHours(event.endTime);
    const alignedStart = roundToNearestHalfHour(startVal);
    const alignedEnd = roundToNearestHalfHour(endVal);
    const durationHours = Math.max(0.5, alignedEnd - alignedStart);

    const rect = dayColumnsRef.current.getBoundingClientRect();
    const eventTop = ((alignedStart - startHour) / hourRange) * rect.height;
    const offsetY = e.clientY - (rect.top + eventTop);

    dragInfoRef.current = {
      eventId: event.id,
      durationHours,
      offsetY,
    };
    setDraggingEventId(event.id);
    setHoveredSlot(null);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    // CALENDAR CARD - The main calendar container with theme styling
    <div
      data-component="CalendarCard"
      ref={containerRef}
      id={id}
      className={`flex flex-col p-8 ${themeClasses} transition-all duration-300 rounded-xl shadow-2xl relative`}
      style={canvasStyles}
    >

      {/* CALENDAR CONTENT - Wrapper for header + grid */}
      <div 
        data-component="CalendarContent"
      >
        {/* DAY HEADER - Shows MON TUE WED THU FRI (SAT SUN if needed) */}
        <div data-component="DayHeader" className="flex mb-4">
          <div className="w-12 shrink-0"></div>
          <div
            onClick={() => interactive && onHeaderClick && onHeaderClick()}
            className={`flex-1 grid relative ${interactive && onHeaderClick ? 'cursor-pointer rounded-lg transition-all hover:bg-white/10 hover:ring-2 hover:ring-blue-400/50' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))`,
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
        </div>

      {/* SCHEDULE GRID - The main time grid with events */}
      <div data-component="ScheduleGrid" className="flex relative isolate" style={{ height: `${canvasDimensions.gridHeight}px` }}>
        {/* TIME COLUMN - Shows 8:00, 9:00, etc. */}
        <div
          data-component="TimeColumn"
          onClick={() => interactive && onTimeColumnClick && onTimeColumnClick()}
          className={`w-12 flex flex-col text-xs font-mono pr-2 items-end relative z-10 shrink-0 ${interactive && onTimeColumnClick ? 'cursor-pointer rounded-lg transition-all hover:bg-white/10 hover:ring-2 hover:ring-blue-400/50' : ''}`}
          style={{
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
                  height: `${canvasDimensions.gridHeight / hourRange}px`,
                  ...(template.timeColumnTextColor ? { color: template.timeColumnTextColor } : {}),
                }}
                className={hourTextColor}
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
          onMouseLeave={() => setHoveredSlot(null)}
        >
          {/* GRID LINES - Horizontal hour separator lines */}
          <div data-component="GridLines" className="absolute inset-0 z-0 flex flex-col pointer-events-none">
            {hours.map((hour) => (
              <div key={hour} style={{ height: `${canvasDimensions.gridHeight / hourRange}px` }} className={`w-full ${template.showGrid ? `border-t ${gridBorderColor}` : ''}`}></div>
            ))}
          </div>

          {/* DAY COLUMN - Individual day column containing events */}
          {visibleDays.map((_, dayIndex) => {
            const hoveredSlotForDay = hoveredSlot?.dayIndex === dayIndex ? hoveredSlot : null;
            const slotTopPercent = hoveredSlotForDay
              ? ((hoveredSlotForDay.startHour - startHour) / hourRange) * 100
              : 0;
            const slotHeightPercent = (1 / hourRange) * 100;

            return (
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
                {hoveredSlotForDay && onEmptyBlockClick && (
                  <div
                    data-component="EmptySlot"
                    className="absolute left-1 right-1 rounded-md border flex items-center justify-center text-sm font-semibold tracking-wide transition-all duration-150"
                    style={{
                      top: `${slotTopPercent}%`,
                      height: `${slotHeightPercent}%`,
                      zIndex: 5,
                      color: addSlotTextColor,
                      ...addSlotStyle,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const startTime = formatTimeFromHours(hoveredSlotForDay.startHour);
                      const endTime = formatTimeFromHours(hoveredSlotForDay.startHour + 1);
                      onEmptyBlockClick({
                        dayIndex,
                        startTime,
                        endTime,
                      });
                    }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </div>
                )}
                {events.filter(e => e.dayIndex === dayIndex).map(event => {
                  const isSelected = selectedEventId === event.id;
                  const isDragging = draggingEventId === event.id;
                  const canDrag = interactive && onEventTimeChange && isSelected;
                  const shouldHideBorder = hideUnselectedBorders && !isSelected;

                  // Original time values
                  const startVal = parseInt(event.startTime.split(':')[0]) + parseInt(event.startTime.split(':')[1]) / 60;
                  const endVal = parseInt(event.endTime.split(':')[0]) + parseInt(event.endTime.split(':')[1]) / 60;

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
                    data-event-id={event.id}
                    key={event.id}
                    onClick={() => interactive && onEventClick && onEventClick(event)}
                    onMouseDown={(e) => handleEventMouseDown(event, e)}
                    className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm border flex flex-col
                      ${interactive ? 'cursor-pointer hover:brightness-110 hover:shadow-md hover:z-50 transition-all' : ''}
                      ${canDrag ? 'cursor-grab' : ''}
                      ${isDragging ? 'cursor-grabbing' : ''}
                      ${event.isConfidenceLow && interactive ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                    `}
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                      // Apply acrylic effect for acrylic theme
                      ...(template.themeFamily === 'acrylic' && currentTheme.eventBlock.acrylicBackground
                        ? {
                            // Use event color with opacity based on eventOpacity setting
                            background: `${event.color}${Math.round(template.eventOpacity * 0.35 * 255).toString(16).padStart(2, '0')}`,
                            boxShadow: currentTheme.eventBlock.shadow,
                            border: currentTheme.eventBlock.border,
                            overflow: 'hidden',
                          }
                        : template.themeFamily === 'glass'
                        ? {
                            backgroundColor: `${event.color}${Math.round(template.eventOpacity * 255).toString(16).padStart(2, '0')}`,
                            borderColor: 'rgba(255,255,255,0.2)',
                            overflow: 'hidden',
                          }
                        : {
                            backgroundColor: event.color + Math.round(template.eventOpacity * 255).toString(16).padStart(2, '0'),
                            borderColor: 'rgba(0,0,0,0.1)',
                          }),
                      ...(isSelected
                        ? {
                            borderColor: selectedBorderColor,
                            borderWidth: '3px',
                            boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
                          }
                        : {}),
                      ...(shouldHideBorder ? { borderColor: 'transparent' } : {}),
                      color: '#fff',
                      zIndex: isDragging ? 30 : isSelected ? 20 : 10,
                      userSelect: isDragging ? 'none' : 'auto',
                    }}
                  >
                  {/* Backdrop blur layer for acrylic/glass themes */}
                  {(template.themeFamily === 'acrylic' || template.themeFamily === 'glass') && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        // In export mode, use semi-transparent background instead of backdrop blur
                        ...(exportMode ? {
                          // Export fallback: gradient overlay to simulate frosted glass
                          background: template.themeVariant === 'light'
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%)',
                        } : {
                          backdropFilter: `blur(${12 * blurScale}px)`,
                          WebkitBackdropFilter: `blur(${12 * blurScale}px)`,
                        }),
                        pointerEvents: 'none',
                        borderRadius: 'inherit',
                        zIndex: -1,
                      }}
                    />
                  )}
                  {/* Grain texture overlay for acrylic theme */}
                  {template.themeFamily === 'acrylic' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url('${acrylicTextureUrl}')`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: '128px 128px',
                        opacity: 0.1,
                        pointerEvents: 'none',
                        borderRadius: 'inherit',
                      }}
                    />
                  )}
                  <div className="flex flex-col min-w-0 overflow-hidden gap-0 relative z-10">
                    <div
                      className="font-bold leading-none uppercase tracking-wide break-words"
                      style={{
                        fontSize: `${template.fontScale * 0.75}rem`,
                        fontFamily: template.titleFont,
                        color: template.titleTextColor || (template.themeFamily === 'acrylic'
                          ? currentTheme.eventBlock.titleColor
                          : '#1f2937')
                      }}
                      title={showFullTitle ? event.title : event.displayTitle}
                    >
                      {showFullTitle ? event.title : event.displayTitle}
                    </div>

                    {/* Class Type Label */}
                    {template.showClassType && (
                      <div
                        className="font-semibold opacity-90"
                        style={{
                          fontSize: `${template.fontScale * 0.6}rem`,
                          fontFamily: template.subtitleFont,
                          color: template.subtitleTextColor || (template.themeFamily === 'acrylic'
                            ? currentTheme.eventBlock.subtitleColor
                            : '#1f2937'),
                          marginTop: '2px'
                        }}
                      >
                        {event.classType === 'Custom' ? event.customClassType : event.classType}
                      </div>
                    )}
                  </div>

                  {!template.compact && (
                    <div
                      className="opacity-90 flex flex-col gap-0 min-w-0 overflow-hidden"
                      style={{
                        fontSize: `${template.fontScale * 0.6}rem`,
                        fontFamily: template.detailsFont,
                        color: template.detailsTextColor || (template.themeFamily === 'acrylic'
                          ? currentTheme.eventBlock.detailsColor
                          : '#374151'),
                        marginTop: '2px'
                      }}
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
            );
          })}
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
