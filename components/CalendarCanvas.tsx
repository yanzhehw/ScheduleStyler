import React, { useMemo, useRef, useEffect, useState } from 'react';
import { CalendarEvent, TemplateConfig, SelectableExportComponent, ResizeEdge, OnboardingComponent } from '../types';
import { MapPin, AlignLeft, Plus, MousePointerClick, MoveUp, MoveDown } from 'lucide-react';
import { getTheme } from '../themes';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';
import { useBackgrounds } from '../contexts/BackgroundsContext';
import { currentTheme as siteTheme } from '../lib/site_themes';

interface CalendarCanvasProps {
  events: CalendarEvent[];
  template: TemplateConfig;
  onEventClick?: (event: CalendarEvent) => void;
  onBlankClick?: () => void;
  interactive?: boolean;
  id?: string;
  showFullTitle?: boolean;
  /** Callback to report computed dimensions to parent */
  onDimensionsComputed?: (dimensions: { width: number; height: number; minCardWidth: number; minCardHeight: number }) => void;
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
  /** Callback when a drag ends */
  onEventDragEnd?: (
    eventId: string,
    original: { startTime: string; endTime: string; dayIndex: number },
    updated: { startTime: string; endTime: string; dayIndex: number }
  ) => void;
  /** Highlight overlapping events */
  overlappingEventIds?: string[];
  /** Hide text content in event blocks (keep colored boxes only, for preview) */
  hideTextContent?: boolean;
  /** Minimum time range to display (e.g., always show 8am-6pm even if events are within a smaller range) */
  minTimeRange?: { start: number; end: number };
  /** Whether calendar card is currently selected for resizing (export mode) */
  isCalendarCardSelected?: boolean;
  /** Callback when calendar card area (not events) is clicked */
  onCalendarCardSelect?: () => void;
  /** Current resize edge being hovered (for cursor display) */
  hoveredResizeEdge?: ResizeEdge;
  /** Callback when mouse moves near edges (for resize cursor) */
  onEdgeHover?: (edge: ResizeEdge) => void;
  /** Callback when resize drag starts */
  onResizeStart?: (edge: ResizeEdge, mousePos: { x: number; y: number }) => void;
  /** Selected component highlight mode */
  highlightMode?: 'none' | 'all' | SelectableExportComponent;
  /** Components still showing onboarding highlights */
  onboardingComponents?: Partial<Record<OnboardingComponent, boolean>>;
  onboardingEventId?: string | null;
  /** Custom message for event block onboarding (JSX) */
  eventBlockOnboardingMessage?: React.ReactNode;
  /** Callback when onboarding OK button is pressed */
  onOnboardingOk?: (component: OnboardingComponent) => void;
  /** Trigger to recompute hover state from current cursor position */
  hoverResetToken?: number;
  /** Show reset-to-fill button when calendar card is selected and resized */
  showResetToFill?: boolean;
  /** Callback to reset calendar card insets */
  onResetToFill?: () => void;
  /** Border radius for mockup mode clipping (clips content but not selection overlay) */
  mockupClipBorderRadius?: string;
  /** Override the template's border radius for the background container */
  overrideBorderRadius?: string;
  /** Mockup overlay to render between events and callouts/selection (for proper z-layering) */
  mockupOverlay?: React.ReactNode;
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
const EVENT_BLOCK_PADDING = 30; // Account for block padding, margins, and tracking-wide letter-spacing

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

  // Use individual font sizes for character width calculations
  const titleFontSize = template.titleFontSize;
  const detailFontSize = template.detailsFontSize;

  // Average char width is roughly 0.55x font size for proportional fonts
  // Use 0.8 for uppercase (titles are uppercase) as they're wider, plus letter-spacing
  const titleCharWidth = titleFontSize * 0.8;
  const detailCharWidth = detailFontSize * 0.55;

  let maxRequiredWidth = ABSOLUTE_MIN_BLOCK_WIDTH;

  events.forEach(event => {
    // Title text - find the longest word to ensure no word wrapping
    const title = showFullTitle ? event.title : event.displayTitle;
    const words = title.split(/\s+/);
    const longestWordLength = Math.max(...words.map(w => w.length));
    // Width needed for the longest word to fit without wrapping
    const titleWidth = longestWordLength * titleCharWidth;

    // Class type text - also find longest word
    let classTypeWidth = 0;
    if (template.showClassType) {
      const classTypeText = event.classType === 'Custom' ? (event.customClassType || '') : event.classType;
      const classTypeWords = classTypeText.split(/\s+/);
      const longestClassWord = Math.max(...classTypeWords.map(w => w.length), 0);
      classTypeWidth = longestClassWord * detailCharWidth;
    }

    // Location text - find longest word
    let locationWidth = 0;
    if (template.showLocation && event.location && !template.compact) {
      const locationWords = event.location.split(/\s+/);
      const longestLocationWord = Math.max(...locationWords.map(w => w.length), 0);
      // Account for icon width (~14px)
      locationWidth = (longestLocationWord * detailCharWidth) + 14;
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
): {
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  minCanvasWidth: number;
  minCanvasHeight: number;
} => {
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

      // When width shrinks, text wraps more and needs more height
      // Calculate compression ratio and add proportional extra height
      const widthCompressionRatio = naturalCanvasWidth / targetWidth;
      if (widthCompressionRatio > 1) {
        // Add extra height proportional to width compression (diminishing returns)
        // sqrt gives a reasonable approximation of text reflow behavior
        const extraHeightFactor = Math.sqrt(widthCompressionRatio) - 1;
        const extraHeight = (minGridHeight * extraHeightFactor * 0.3); // 30% of grid height scaled by compression
        finalHeight = naturalCanvasHeight + extraHeight;
        // Recalculate width to maintain target ratio with new height
        finalWidth = finalHeight * targetRatio;
        // Ensure we don't go below minimum
        if (finalWidth < minCanvasWidth) {
          finalWidth = minCanvasWidth;
          finalHeight = minCanvasWidth / targetRatio;
        }
      }
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
    minCanvasWidth,
    minCanvasHeight,
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
// Uses line-height multiplier of 1.4 because CSS renders text with line-height: 1.4
// (standard typographic spacing - actual rendered line box = fontSize × 1.4)
const calculateMinEventHeight = (
  event: CalendarEvent,
  template: TemplateConfig,
  showFullTitle: boolean,
  debug: boolean = false
): number => {
  // Each text field uses its own font size from template
  const titleFontSize = template.titleFontSize;       // Title text
  const subtitleFontSize = template.subtitleFontSize; // Class type label
  const detailsFontSize = template.detailsFontSize;   // Time, location, notes

  // Line-height multiplier matches CSS leading-none + visual spacing
  // In the event block, we use leading-none (line-height: 1) but have gaps between elements
  // The 1.4 factor accounts for the effective vertical space each text line occupies
  const lineHeight = 1.4;

  const breakdown: { component: string; height: number; detail?: string }[] = [];

  let totalHeight = 16; // Base padding (p-1.5 = 6px × 2 = 12px, plus ~4px internal margins)
  breakdown.push({ component: 'basePadding', height: 16 });

  // Title height - estimate lines based on character count
  const title = showFullTitle ? event.title : event.displayTitle;
  const titleLines = Math.ceil(title.length / 12); // ~12 chars per line estimate
  const titleHeight = titleFontSize * lineHeight * Math.min(titleLines, 2);
  totalHeight += titleHeight;
  breakdown.push({
    component: 'title',
    height: titleHeight,
    detail: `"${title}" (${title.length} chars → ${titleLines} lines, capped at 2) × ${titleFontSize}px × ${lineHeight}`,
  });

  if (!template.compact) {
    // Class type uses subtitleFontSize (not detailsFontSize)
    if (template.showClassType) {
      const classTypeHeight = subtitleFontSize * lineHeight + 2;
      totalHeight += classTypeHeight;
      breakdown.push({
        component: 'classType',
        height: classTypeHeight,
        detail: `${subtitleFontSize}px × ${lineHeight} + 2px margin`,
      });
    }

    // Time height
    if (template.showTime) {
      const timeHeight = detailsFontSize * lineHeight + 2;
      totalHeight += timeHeight;
      breakdown.push({
        component: 'time',
        height: timeHeight,
        detail: `${detailsFontSize}px × ${lineHeight} + 2px margin`,
      });
    }

    // Location height
    if (template.showLocation && event.location) {
      const locationHeight = detailsFontSize * lineHeight + 2;
      totalHeight += locationHeight;
      breakdown.push({
        component: 'location',
        height: locationHeight,
        detail: `"${event.location}" - ${detailsFontSize}px × ${lineHeight} + 2px margin`,
      });
    }

    // Notes height (estimate 2 lines max for calculation)
    if ((event.includeNotes ?? template.showNotes) && event.notes) {
      const notesHeight = detailsFontSize * lineHeight * 2 + 8;
      totalHeight += notesHeight;
      breakdown.push({
        component: 'notes',
        height: notesHeight,
        detail: `2 lines × ${detailsFontSize}px × ${lineHeight} + 8px margin`,
      });
    }
  } else {
    breakdown.push({ component: 'compact', height: 0, detail: 'compact mode - skipping details' });
  }

  if (debug) {
    console.log('[calculateMinEventHeight] Breakdown:', {
      title,
      fontSizes: { title: titleFontSize, subtitle: subtitleFontSize, details: detailsFontSize },
      breakdown,
      totalHeight,
    });
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
  hideUnselectedBorders = false,
  onEventDragEnd,
  overlappingEventIds,
  hideTextContent = false,
  minTimeRange,
  isCalendarCardSelected = false,
  onCalendarCardSelect,
  hoveredResizeEdge,
  onEdgeHover,
  onResizeStart,
  highlightMode = 'none',
  onboardingComponents,
  onboardingEventId,
  eventBlockOnboardingMessage,
  onOnboardingOk,
  hoverResetToken,
  showResetToFill = false,
  onResetToFill,
  mockupClipBorderRadius,
  overrideBorderRadius,
  mockupOverlay,
}) => {
  // Get background image map from context
  const { imageMap } = useBackgrounds();

  const containerRef = useRef<HTMLDivElement>(null);
  const dayColumnsRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ dayIndex: number; startHour: number } | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<SelectableExportComponent>('none');
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    eventId: string;
    durationHours: number;
    offsetY: number;
    original: { startTime: string; endTime: string; dayIndex: number };
    latest?: { startTime: string; endTime: string; dayIndex: number };
  } | null>(null);
  const overlappingSet = useMemo(() => new Set(overlappingEventIds ?? []), [overlappingEventIds]);

  const getHoveredComponentFromTarget = (target: HTMLElement | null): SelectableExportComponent => {
    if (!target) return 'none';
    if (target.closest('[data-component="EventBlock"]')) return 'none';
    if (target.closest('[data-component="DayHeader"]')) return 'dayHeader';
    if (target.closest('[data-component="TimeColumn"]')) return 'timeColumn';
    if (target.closest('[data-component="CalendarCard"]')) return 'calendarCard';
    return 'none';
  };

  useEffect(() => {
    if (!interactive) return;
    const handleMouseMove = (e: MouseEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  useEffect(() => {
    if (!interactive) return;
    if (hoverResetToken === undefined) return;
    const lastPointer = lastPointerRef.current;
    if (!lastPointer) {
      setHoveredComponent('none');
      return;
    }
    const target = document.elementFromPoint(lastPointer.x, lastPointer.y) as HTMLElement | null;
    setHoveredComponent(getHoveredComponentFromTarget(target));
  }, [hoverResetToken, interactive]);

  // Calculate visible days and their actual day indices
  const { visibleDays, visibleDayIndices } = useMemo(() => {
    const hasWeekendEvents = events.some(e => e.dayIndex >= 5);
    const baseDays = hasWeekendEvents ? ALL_DAYS : ALL_DAYS.slice(0, 5);
    const baseIndices = hasWeekendEvents
      ? [0, 1, 2, 3, 4, 5, 6]
      : [0, 1, 2, 3, 4];

    return { visibleDays: baseDays, visibleDayIndices: baseIndices };
  }, [events]);

  // Dynamic Time Range Calculation
  const { startHour, hourRange, hours } = useMemo(() => {
    // Default range: 8am-6pm (10 hours)
    const defaultStart = 8;
    const defaultEnd = 18;

    if (events.length === 0) {
      const start = minTimeRange?.start ?? defaultStart;
      const end = minTimeRange?.end ?? defaultEnd;
      const range = end - start;
      return { startHour: start, hourRange: range, hours: Array.from({ length: range }, (_, i) => i + start) };
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

    // Don't add extra hour - grid ends exactly at latest event end time
    maxH = Math.min(24, maxH);

    // Apply minimum time range if specified (expand to include it, never shrink)
    if (minTimeRange) {
      minH = Math.min(minH, minTimeRange.start);
      maxH = Math.max(maxH, minTimeRange.end);
    }

    if (maxH - minH < 4) {
      maxH = Math.min(24, minH + 4);
      if (maxH - minH < 4) minH = Math.max(0, maxH - 4);
    }

    const range = maxH - minH;
    const h = Array.from({ length: range }, (_, i) => i + minH);

    return { startHour: minH, hourRange: range, hours: h };
  }, [events, minTimeRange]);

  // Calculate dynamic hour height based on content that needs to fit
  const hourHeight = useMemo(() => {
    const baseHourHeight = 60; // Base height per hour in pixels

    if (events.length === 0) return baseHourHeight;

    let maxRequiredHourHeight = baseHourHeight;
    let tightestEvent: { title: string; minContentHeight: number; durationHours: number; requiredHourHeight: number } | null = null;

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

      if (requiredHourHeight > maxRequiredHourHeight) {
        maxRequiredHourHeight = requiredHourHeight;
        tightestEvent = {
          title: showFullTitle ? event.title : event.displayTitle,
          minContentHeight,
          durationHours,
          requiredHourHeight,
        };
      }
    });

    // Debug: log the tightest (most constrained) event with detailed breakdown
    if (tightestEvent) {
      console.log('[hourHeight] Tightest event:', tightestEvent);
      // Re-calculate with debug=true to get detailed breakdown
      const tightestEventObj = events.find(e =>
        (showFullTitle ? e.title : e.displayTitle) === tightestEvent.title
      );
      if (tightestEventObj) {
        calculateMinEventHeight(tightestEventObj, template, showFullTitle, true);
      }
    }

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

  // Get the current theme object
  const currentTheme = useMemo(() => {
    return getTheme(template.themeFamily, template.themeVariant, template.themeSubVariant);
  }, [template.themeFamily, template.themeVariant, template.themeSubVariant]);

  // Theme styles
  const themeClasses = useMemo(() => {
    // Handle both legacy single theme strings and new structured theme format
    const themeId = template.theme;
    const variant = template.themeVariant;
    const family = template.themeFamily;
    const hasCustomBg = template.backgroundType !== 'none';

    // For acrylic and solid-grain, we'll handle background via inline styles
    if (family === 'acrylic' || family === 'solid-grain') {
      return variant === 'light'
        ? 'text-gray-900 border-gray-200'
        : 'text-gray-100 border-gray-700';
    }

    // Check if it's glass family
    if (themeId?.includes('glass') || family === 'glass') {
      return hasCustomBg
        ? 'backdrop-blur-xl text-white border-white/20'
        : 'bg-white/10 backdrop-blur-xl text-white border-white/20';
    }

    // Check variant for light/dark
    if (variant === 'light' || themeId === 'light' || themeId?.includes('light')) {
      // Background handled via inline styles in canvasStyles
      return 'text-gray-900 border-gray-200';
    }

    // Default to dark - background handled via inline styles in canvasStyles
    return 'text-gray-100 border-gray-700';
  }, [template.theme, template.themeVariant, template.themeFamily, template.backgroundType]);

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

  // Get background image URL based on template settings
  const backgroundImageUrl = useMemo(() => {
    if (template.backgroundType !== 'image') return null;
    if (template.backgroundImage === 'custom' && template.customBackgroundImage) {
      return template.customBackgroundImage;
    }
    if (template.backgroundImage && imageMap[template.backgroundImage]) {
      return imageMap[template.backgroundImage];
    }
    return null;
  }, [template.backgroundType, template.backgroundImage, template.customBackgroundImage, imageMap]);

  // Calculate background dimensions from aspectRatio slider
  // The background is now the source of truth for the export canvas size
  const backgroundDimensions = useMemo(() => {
    // Base size - use minimum content dimensions as starting point
    const baseSize = 600; // Reference size for calculations

    // Calculate background target ratio from slider (interpolate between 16:9 and 9:19.5)
    const LANDSCAPE_RATIO = 16 / 9;    // ~1.778 (slider = 0)
    const PORTRAIT_RATIO = 9 / 19.5;   // ~0.462 (slider = 1)
    const bgTargetRatio = LANDSCAPE_RATIO + (PORTRAIT_RATIO - LANDSCAPE_RATIO) * template.aspectRatio;

    let bgWidth: number;
    let bgHeight: number;

    // Calculate background dimensions to fit the content with insets applied
    // Start from content dimensions and expand to accommodate the aspect ratio
    const contentWidth = canvasDimensions.width;
    const contentHeight = canvasDimensions.height;

    // Keep background size tied to content, not to inset scaling, so the CC can shrink without inflating the canvas.
    const minBgWidthForContent = contentWidth;
    const minBgHeightForContent = contentHeight;

    // Calculate dimensions that satisfy both content constraints and aspect ratio
    if (bgTargetRatio > 1) {
      // Landscape - width is larger
      bgHeight = Math.max(minBgHeightForContent, baseSize);
      bgWidth = bgHeight * bgTargetRatio;
      // Ensure width is large enough for content
      if (bgWidth < minBgWidthForContent) {
        bgWidth = minBgWidthForContent;
        bgHeight = bgWidth / bgTargetRatio;
      }
    } else {
      // Portrait - height is larger
      bgWidth = Math.max(minBgWidthForContent, baseSize);
      bgHeight = bgWidth / bgTargetRatio;
      // Ensure height is large enough for content
      if (bgHeight < minBgHeightForContent) {
        bgHeight = minBgHeightForContent;
        bgWidth = bgHeight * bgTargetRatio;
      }
    }

    return {
      width: bgWidth,
      height: bgHeight,
    };
  }, [template.aspectRatio, canvasDimensions]);

  // Calculate card dimensions from background dimensions and insets
  const cardDimensions = useMemo(() => {
    const insets = template.calendarCardInsets;
    const cardWidthPercent = (100 - insets.left - insets.right) / 100;
    const cardHeightPercent = (100 - insets.top - insets.bottom) / 100;

    const cardWidth = backgroundDimensions.width * cardWidthPercent;
    const cardHeight = backgroundDimensions.height * cardHeightPercent;

    // Position within the background
    const cardX = backgroundDimensions.width * (insets.left / 100);
    const cardY = backgroundDimensions.height * (insets.top / 100);

    return {
      width: cardWidth,
      height: cardHeight,
      x: cardX,
      y: cardY,
      // Grid dimensions for internal layout
      gridWidth: cardWidth - TIME_COLUMN_WIDTH - GRID_PADDING,
      gridHeight: cardHeight - HEADER_HEIGHT - FOOTER_HEIGHT - GRID_PADDING,
    };
  }, [backgroundDimensions, template.calendarCardInsets]);

  // Report computed dimensions to parent (for ZoomWrapper sizing)
  // Reports background dimensions since that's the export canvas size
  useEffect(() => {
    if (onDimensionsComputed) {
      onDimensionsComputed({
        width: backgroundDimensions.width,
        height: backgroundDimensions.height,
        minCardWidth: canvasDimensions.minCanvasWidth,
        minCardHeight: canvasDimensions.minCanvasHeight,
      });
    }
  }, [
    backgroundDimensions.width,
    backgroundDimensions.height,
    canvasDimensions.minCanvasWidth,
    canvasDimensions.minCanvasHeight,
    onDimensionsComputed,
  ]);

  // Canvas inline styles for the calendar card
  const canvasStyles = useMemo(() => {
    const baseStyles: React.CSSProperties = {
      borderRadius: template.borderRadius,
      width: `${cardDimensions.width}px`,
      height: `${cardDimensions.height}px`,
    };

    // Solid-grain has its own colored canvas background with grain texture
    if (template.themeFamily === 'solid-grain') {
      return {
        ...baseStyles,
        background: currentTheme.canvas.background,
        backgroundSize: currentTheme.canvas.backgroundSize || 'auto',
        backgroundPosition: currentTheme.canvas.backgroundPosition || 'center',
        backgroundBlendMode: currentTheme.canvas.backgroundBlendMode,
      };
    }

    // When custom background is set, or using acrylic/solid-grain theme, make canvas transparent
    // (both themes apply grain texture to event blocks, not canvas)
    if (template.backgroundType !== 'none' || template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain') {
      return {
        ...baseStyles,
        background: 'transparent',
      };
    }

    // For default theme with no background, use themed calendar card background
    const isLight = template.themeVariant === 'light' || template.theme?.includes('light');
    return {
      ...baseStyles,
      background: isLight ? '#ffffff' : `var(--calendar-card-background, ${siteTheme.calendarCard.background})`,
    };
  }, [template.borderRadius, template.themeFamily, template.backgroundType, template.themeVariant, template.theme, cardDimensions, currentTheme]);

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
  const isOnboardingActive = (component: OnboardingComponent) =>
    onboardingComponents?.[component] ?? false;
  const showDayHeaderHighlight = isOnboardingActive('dayHeader') || highlightMode === 'dayHeader';
  const showTimeColumnHighlight = isOnboardingActive('timeColumn') || highlightMode === 'timeColumn';

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

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const dragInfo = dragInfoRef.current;
      if (!dragInfo || !dayColumnsRef.current) return;

      const rect = dayColumnsRef.current.getBoundingClientRect();
      // Handle both mouse and touch events
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top - dragInfo.offsetY;
      const dayWidth = rect.width / visibleDays.length;
      const rawDayIndex = Math.floor(x / dayWidth);
      const nextDayIndex = Math.min(visibleDays.length - 1, Math.max(0, rawDayIndex));

      const hourHeightPx = rect.height / hourRange;
      const rawStart = startHour + y / hourHeightPx;
      const snappedStart = roundToNearestHalfHour(rawStart);
      const maxStart = startHour + hourRange - dragInfo.durationHours;
      const clampedStart = Math.min(maxStart, Math.max(startHour, snappedStart));
      const clampedEnd = clampedStart + dragInfo.durationHours;

      dragInfo.latest = {
        startTime: formatTimeFromHours(clampedStart),
        endTime: formatTimeFromHours(clampedEnd),
        dayIndex: nextDayIndex,
      };
      onEventTimeChange(dragInfo.eventId, dragInfo.latest);
    };

    const handleUp = () => {
      const dragInfo = dragInfoRef.current;
      if (dragInfo && onEventDragEnd) {
        const updated = dragInfo.latest ?? dragInfo.original;
        onEventDragEnd(dragInfo.eventId, dragInfo.original, updated);
      }
      setDraggingEventId(null);
      dragInfoRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingEventId, onEventDragEnd, onEventTimeChange, hourRange, startHour, visibleDays.length]);

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
      original: {
        startTime: event.startTime,
        endTime: event.endTime,
        dayIndex: event.dayIndex,
      },
      latest: {
        startTime: event.startTime,
        endTime: event.endTime,
        dayIndex: event.dayIndex,
      },
    };
    setDraggingEventId(event.id);
    setHoveredSlot(null);
    e.preventDefault();
    e.stopPropagation();
  };

  // Touch handler for mobile dragging
  const handleEventTouchStart = (event: CalendarEvent, e: React.TouchEvent<HTMLDivElement>) => {
    if (!interactive || !onEventTimeChange || selectedEventId !== event.id) return;
    if (!dayColumnsRef.current) return;
    if (e.touches.length !== 1) return; // Only single touch

    const touch = e.touches[0];
    const startVal = parseTimeToHours(event.startTime);
    const endVal = parseTimeToHours(event.endTime);
    const alignedStart = roundToNearestHalfHour(startVal);
    const alignedEnd = roundToNearestHalfHour(endVal);
    const durationHours = Math.max(0.5, alignedEnd - alignedStart);

    const rect = dayColumnsRef.current.getBoundingClientRect();
    const eventTop = ((alignedStart - startHour) / hourRange) * rect.height;
    const offsetY = touch.clientY - (rect.top + eventTop);

    dragInfoRef.current = {
      eventId: event.id,
      durationHours,
      offsetY,
      original: {
        startTime: event.startTime,
        endTime: event.endTime,
        dayIndex: event.dayIndex,
      },
      latest: {
        startTime: event.startTime,
        endTime: event.endTime,
        dayIndex: event.dayIndex,
      },
    };
    setDraggingEventId(event.id);
    setHoveredSlot(null);
  };

  // Render background layer component
  const renderBackgroundLayer = () => (
    <div
      data-component="BackgroundLayer"
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ borderRadius: 'inherit' }}
    >
      {/* Background Image */}
      {template.backgroundType === 'image' && backgroundImageUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: template.backgroundBlur > 0 ? `blur(${template.backgroundBlur}px)` : undefined,
            // Expand slightly to prevent blur edge artifacts
            ...(template.backgroundBlur > 0 ? {
              top: `-${template.backgroundBlur}px`,
              left: `-${template.backgroundBlur}px`,
              right: `-${template.backgroundBlur}px`,
              bottom: `-${template.backgroundBlur}px`,
            } : {}),
          }}
        />
      )}
      {/* Background Color */}
      {template.backgroundType === 'color' && template.backgroundColor && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: template.backgroundColor }}
        />
      )}
      {/* Reduce Highlights Overlay - semi-transparent black layer to reduce highlights */}
      {template.backgroundOverlay > 0 && template.backgroundType === 'image' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${template.backgroundOverlay / 100})`,
          }}
        />
      )}
    </div>
  );

  // Background container is always used now
  const useOuterContainer = true;

  // Wrapper component for background container - always renders
  const OuterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Determine outer container background
    const outerBgStyle: React.CSSProperties = {};
    if (template.backgroundType === 'none') {
      // Use theme-appropriate solid background when no custom background
      const variant = template.themeVariant;
      const family = template.themeFamily;
      if (family === 'glass') {
        outerBgStyle.background = 'rgba(255,255,255,0.1)';
        outerBgStyle.backdropFilter = 'blur(12px)';
      } else if (variant === 'light') {
        outerBgStyle.background = '#ffffff';
      } else {
        // Use theme calendar card background color
        outerBgStyle.background = `var(--calendar-card-background, ${siteTheme.calendarCard.background})`;
      }
    }

    const cardTop = cardDimensions.y;

    return (
      <div
        data-component="BackgroundContainer"
        id={id}
        className="relative rounded-xl shadow-2xl"
        style={{
          width: `${backgroundDimensions.width}px`,
          height: `${backgroundDimensions.height}px`,
          borderRadius: overrideBorderRadius || template.borderRadius,
          ...outerBgStyle,
        }}
        onClick={(e: React.MouseEvent) => {
          // Deselect card when clicking on background (not on the card itself)
          const target = e.target as HTMLElement;
          const isCardArea = target.closest('[data-component="CalendarCardWrapper"]') ||
                            target.closest('[data-component="CalendarCard"]') ||
                            target.closest('[data-component="ResizeEdge-top"]') ||
                            target.closest('[data-component="ResizeEdge-bottom"]') ||
                            target.closest('[data-component="ResizeEdge-left"]') ||
                            target.closest('[data-component="ResizeEdge-right"]') ||
                            target.closest('[data-component="ResetToFillButton"]');
          if (!isCardArea && interactive && onBlankClick) {
            onBlankClick();
          }
        }}
      >
        {/* Background clipper - ONLY clips the background layer, not content or callouts */}
        <div
          data-component="BackgroundClipper"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: mockupClipBorderRadius || 'inherit',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* Background fills the outer container (only when there's an image or color background) */}
          {template.backgroundType !== 'none' && renderBackgroundLayer()}
        </div>
        {/* Calendar card positioned within - NOT inside clipper so callouts can escape */}
        <div
          data-component="CalendarCardWrapper"
          className={`transition-all duration-200 ease-in relative ${
            interactive && onCalendarCardSelect ? 'rounded-xl' : ''
          } ${
            interactive && onCalendarCardSelect && !isCalendarCardSelected && hoveredComponent === 'calendarCard' && highlightMode === 'none'
              ? 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-transparent'
              : ''
          }`}
          style={{
            position: 'absolute',
            left: `${cardDimensions.x}px`,
            top: `${cardTop}px`,
          }}
        >
          {showResetToFill && onResetToFill && (
            <button
              type="button"
              data-component="ResetToFillButton"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onResetToFill();
              }}
              className="absolute top-3 right-3 z-[120] rounded-lg border border-white/15 bg-slate-900/50 px-3 py-2 text-xs text-white/90 shadow-lg backdrop-blur-md transition hover:border-white/30 hover:bg-slate-900/70 hover:text-white"
            >
              Reset to fill canvas
            </button>
          )}
          {children}
        </div>
        {/* Mockup overlay - renders between events and callouts/selection for proper z-layering */}
        {mockupOverlay}
        {/* Time column onboarding callout - positioned at top level to escape stacking contexts */}
        {isOnboardingActive('timeColumn') && (
          <div
            data-component="OnboardingCallout-timeColumn"
            style={{
              position: 'absolute',
              left: cardDimensions.x + 32 + 48, // card padding (32px) + time column width (48px) = right edge
              top: cardTop + 46 + cardDimensions.gridHeight / 2, // header area (~46px) + half grid height
              transform: 'translateY(-50%)',
              zIndex: 200,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0">
              {/* Arrow pointing left */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '8px solid rgba(245, 158, 11, 0.4)',
                }}
              />
              <div className="relative group bg-amber-500/20 border border-amber-500/35 rounded-lg p-2.5 text-xs text-amber-200/90 backdrop-blur-md max-w-[350px]">
                <p className="break-words">
                  <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-amber-400" />
                  Click to edit time labels
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Selection overlay for CC resizing - dotted lines with corner extensions and arrows */}
        {isCalendarCardSelected && (() => {
          const cardLeft = cardDimensions.x;
          const cardRight = cardDimensions.x + cardDimensions.width;
          const cardBottom = cardTop + cardDimensions.height;
          const lineColor = 'rgba(148, 163, 184, 0.95)'; // gray-400
          const lineWidth = 3;
          const horizontalExtension = 48;
          const verticalExtension = 32;
          const dashLength = 14;
          const dashGap = 8;
          const topLineLeft = cardLeft - horizontalExtension;
          const topLineRight = cardRight + horizontalExtension;
          const topLineWidth = topLineRight - topLineLeft;
          const sideLineTop = cardTop - verticalExtension;
          const sideLineBottom = cardBottom + verticalExtension;
          const sideLineHeight = sideLineBottom - sideLineTop;
          const arrowSize = 28;
          const arrowGap = 14;
          const arrowLeft = cardRight + 12;
          const topArrowTop = cardTop - arrowSize - arrowGap;
          const bottomArrowTop = cardTop + arrowGap;

          return (
            <>
              {/* Dotted outline with slight corner extensions */}
              <div
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardTop,
                  width: topLineWidth,
                  height: lineWidth,
                  backgroundImage: `repeating-linear-gradient(90deg, ${lineColor} 0 ${dashLength}px, transparent ${dashLength}px ${dashLength + dashGap}px)`,
                  backgroundRepeat: 'repeat-x',
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardBottom,
                  width: topLineWidth,
                  height: lineWidth,
                  backgroundImage: `repeating-linear-gradient(90deg, ${lineColor} 0 ${dashLength}px, transparent ${dashLength}px ${dashLength + dashGap}px)`,
                  backgroundRepeat: 'repeat-x',
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: cardLeft,
                  top: sideLineTop,
                  width: lineWidth,
                  height: sideLineHeight,
                  backgroundImage: `repeating-linear-gradient(180deg, ${lineColor} 0 ${dashLength}px, transparent ${dashLength}px ${dashLength + dashGap}px)`,
                  backgroundRepeat: 'repeat-y',
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: cardRight,
                  top: sideLineTop,
                  width: lineWidth,
                  height: sideLineHeight,
                  backgroundImage: `repeating-linear-gradient(180deg, ${lineColor} 0 ${dashLength}px, transparent ${dashLength}px ${dashLength + dashGap}px)`,
                  backgroundRepeat: 'repeat-y',
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              />

              {/* Arrow indicators on top-right showing vertical adjustment */}
              <div
                style={{
                  position: 'absolute',
                  left: arrowLeft,
                  top: topArrowTop,
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              >
                <MoveUp size={28} color={lineColor} strokeWidth={2} style={{ filter: 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.35))' }} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: arrowLeft,
                  top: bottomArrowTop,
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              >
                <MoveDown size={28} color={lineColor} strokeWidth={2} style={{ filter: 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.35))' }} />
              </div>

              {/* Edge hit areas for resize - invisible areas on each edge */}
              {/* Top edge */}
              <div
                data-component="ResizeEdge-top"
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardTop - 6,
                  width: topLineWidth,
                  height: 12,
                  cursor: 'n-resize',
                  zIndex: 101,
                }}
                onMouseEnter={() => onEdgeHover?.('top')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('top', { x: e.clientX, y: e.clientY });
                }}
              />
              {/* Bottom edge */}
              <div
                data-component="ResizeEdge-bottom"
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardBottom - 6,
                  width: topLineWidth,
                  height: 12,
                  cursor: 's-resize',
                  zIndex: 101,
                }}
                onMouseEnter={() => onEdgeHover?.('bottom')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('bottom', { x: e.clientX, y: e.clientY });
                }}
              />
              {/* Left edge */}
              <div
                data-component="ResizeEdge-left"
                style={{
                  position: 'absolute',
                  left: cardLeft - 6,
                  top: sideLineTop,
                  width: 12,
                  height: sideLineHeight,
                  cursor: 'ew-resize',
                  zIndex: 101,
                }}
                onMouseEnter={() => onEdgeHover?.('left')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('left', { x: e.clientX, y: e.clientY });
                }}
              />
              {/* Right edge */}
              <div
                data-component="ResizeEdge-right"
                style={{
                  position: 'absolute',
                  left: cardRight - 6,
                  top: sideLineTop,
                  width: 12,
                  height: sideLineHeight,
                  cursor: 'ew-resize',
                  zIndex: 101,
                }}
                onMouseEnter={() => onEdgeHover?.('right')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('right', { x: e.clientX, y: e.clientY });
                }}
              />
            </>
          );
        })()}
        {/* Highlight overlay for onboarding */}
        {isOnboardingActive('calendarCard') && !isCalendarCardSelected && (
          <div
            data-component="HighlightOverlay"
            style={{
              position: 'absolute',
              left: `${cardDimensions.x - 3}px`,
              top: `${cardTop - 3}px`,
              width: `${cardDimensions.width + 6}px`,
              height: `${cardDimensions.height + 6}px`,
              border: '3px dotted rgba(168, 85, 247, 0.6)',
              borderRadius: template.borderRadius,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          />
        )}
        {isOnboardingActive('calendarCard')
          && !isCalendarCardSelected
          && hoveredComponent === 'calendarCard'
          && highlightMode === 'none' && (
          <div
            data-component="HighlightOverlay-hover"
            style={{
              position: 'absolute',
              left: `${cardDimensions.x - 2}px`,
              top: `${cardTop - 2}px`,
              width: `${cardDimensions.width + 4}px`,
              height: `${cardDimensions.height + 4}px`,
              border: '2px solid rgba(59, 130, 246, 0.55)',
              borderRadius: template.borderRadius,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          />
        )}
        {/* Onboarding callout for calendar card */}
        {isOnboardingActive('calendarCard') && (
          <div
            data-component="OnboardingCallout-calendarCard"
            style={{
              position: 'absolute',
              left: `${cardDimensions.x + cardDimensions.width + 12}px`,
              top: `${cardTop + cardDimensions.height / 2 - 16}px`,
              zIndex: 200,
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0">
              {/* Arrow pointing left */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '8px solid rgba(168, 85, 247, 0.4)',
                }}
              />
              <div className="relative group bg-purple-500/20 border border-purple-500/35 rounded-lg p-2.5 text-xs text-purple-200/90 backdrop-blur-md max-w-[350px]">
                <p className="break-words">
                  <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-purple-400" />
                  Click on calendar card to select &amp; resize
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <OuterWrapper>
    {/* CALENDAR CARD - The main calendar container with theme styling */}
    <div
      data-component="CalendarCard"
      ref={containerRef}
      id={useOuterContainer ? undefined : id}
      className={`flex flex-col p-8 ${themeClasses} transition-all duration-300 rounded-xl ${useOuterContainer ? '' : 'shadow-2xl'} relative ${interactive && onCalendarCardSelect ? 'cursor-pointer' : ''}`}
      style={canvasStyles}
      onMouseEnter={(e) => {
        if (!interactive) return;
        setHoveredComponent(getHoveredComponentFromTarget(e.target as HTMLElement));
      }}
      onMouseMove={(e) => {
        if (!interactive) return;
        const nextHovered = getHoveredComponentFromTarget(e.target as HTMLElement);
        if (nextHovered !== hoveredComponent) {
          setHoveredComponent(nextHovered);
        }
      }}
      onMouseLeave={() => {
        if (interactive) {
          setHoveredComponent('none');
        }
      }}
      onClick={(e: React.MouseEvent) => {
        // Only trigger card selection if clicking on the card background (not on events/header/time column)
        const target = e.target as HTMLElement;
        const isEventBlock = target.closest('[data-component="EventBlock"]');
        const isDayHeader = target.closest('[data-component="DayHeader"]');
        const isTimeColumn = target.closest('[data-component="TimeColumn"]');
        const isEmptySlot = target.closest('[data-component="EmptySlot"]');

        if (!isEventBlock && !isDayHeader && !isTimeColumn && !isEmptySlot && interactive && onCalendarCardSelect) {
          onCalendarCardSelect();
        }
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        // Only trigger card selection if tapping on the card background (not on events/header/time column)
        const target = e.target as HTMLElement;
        const isEventBlock = target.closest('[data-component="EventBlock"]');
        const isDayHeader = target.closest('[data-component="DayHeader"]');
        const isTimeColumn = target.closest('[data-component="TimeColumn"]');
        const isEmptySlot = target.closest('[data-component="EmptySlot"]');

        if (!isEventBlock && !isDayHeader && !isTimeColumn && !isEmptySlot && interactive && onCalendarCardSelect) {
          e.stopPropagation();
          onCalendarCardSelect();
        }
      }}
    >
      {/* BACKGROUND LAYER - Renders background image or color (only when not using outer container) */}
      {template.backgroundType !== 'none' && !useOuterContainer && renderBackgroundLayer()}

      {/* CALENDAR CONTENT - Wrapper for header + grid */}
      <div
        data-component="CalendarContent"
        className="relative z-10"
      >
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
              <div key={hour} style={{ height: `${cardDimensions.gridHeight / hourRange}px` }} className={`w-full ${template.showGrid ? `border-t ${gridBorderColor}` : ''}`}></div>
            ))}
          </div>

          {/* DAY COLUMN - Individual day column containing events */}
          {visibleDays.map((_, colIndex) => {
            const actualDayIndex = visibleDayIndices[colIndex];
            const hoveredSlotForDay = hoveredSlot?.dayIndex === actualDayIndex ? hoveredSlot : null;
            const slotTopPercent = hoveredSlotForDay
              ? ((hoveredSlotForDay.startHour - startHour) / hourRange) * 100
              : 0;
            const slotHeightPercent = (1 / hourRange) * 100;

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
                    e.stopPropagation();
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
                        dayIndex: actualDayIndex,
                        startTime,
                        endTime,
                      });
                    }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </div>
                )}
                {events.filter(e => e.dayIndex === actualDayIndex).map(event => {
                  const isSelected = selectedEventId === event.id;
                  const isDragging = draggingEventId === event.id;
                  const canDrag = interactive && onEventTimeChange && isSelected;
                  const isOverlapping = overlappingSet.has(event.id);
                  const shouldHideBorder = hideUnselectedBorders && !isSelected && !isOverlapping;

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
                  const showEventOnboarding = isOnboardingActive('eventBlock') && event.id === onboardingEventId;
                  const calloutTopPx = (topPercent / 100) * cardDimensions.gridHeight + (heightPercent / 100) * cardDimensions.gridHeight / 2;

                  return (
                    <React.Fragment key={event.id}>
                      {/* EVENT BLOCK - Individual class/event card */}
                      <div
                        data-component="EventBlock"
                        data-event-id={event.id}
                        onClick={() => interactive && onEventClick && onEventClick(event)}
                        onMouseDown={(e) => handleEventMouseDown(event, e)}
                        onTouchStart={(e) => handleEventTouchStart(event, e)}
                        onTouchEnd={(e: React.TouchEvent) => {
                          // Handle tap on mobile - only trigger if not dragging
                          if (interactive && onEventClick && !isDragging && selectedEventId !== event.id) {
                            e.preventDefault();
                            e.stopPropagation();
                            onEventClick(event);
                          }
                        }}
                        className={`absolute left-1 right-1 rounded-md p-1.5 shadow-sm border flex flex-col
                          ${template.textAlignVertical === 'center' ? 'justify-center' : template.textAlignVertical === 'bottom' ? 'justify-end' : 'justify-start'}
                          ${interactive ? 'cursor-pointer hover:brightness-110 hover:shadow-md hover:z-[200] transition-all' : ''}
                          ${canDrag ? 'cursor-grab' : ''}
                          ${isDragging ? 'cursor-grabbing' : ''}
                          ${event.isConfidenceLow && interactive ? 'ring-2 ring-red-500 ring-offset-1' : ''}
                        `}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          // Apply acrylic effect for acrylic theme
                          // Use per-event opacity if set, otherwise fall back to template.eventOpacity
                          ...((() => {
                            const eventOpacity = event.opacity ?? template.eventOpacity;
                            // Solid-grain: uses backgroundOpacity + optional gradient, NO acrylicBackground
                            if (template.themeFamily === 'solid-grain') {
                              const bgOpacity = currentTheme.eventBlock.backgroundOpacity ?? 0.7;
                              return {
                                background: currentTheme.eventBlock.gradient
                                  ? `${currentTheme.eventBlock.gradient}, ${event.color}${Math.round(eventOpacity * bgOpacity * 255).toString(16).padStart(2, '0')}`
                                  : `${event.color}${Math.round(eventOpacity * bgOpacity * 255).toString(16).padStart(2, '0')}`,
                                boxShadow: currentTheme.eventBlock.shadow,
                                border: template.eventBlockNoBorders ? 'none' : currentTheme.eventBlock.border,
                                overflow: 'hidden',
                              };
                            }
                            // Acrylic: uses acrylicBackground overlay approach
                            if (template.themeFamily === 'acrylic' && currentTheme.eventBlock.acrylicBackground) {
                              return {
                                // Use event color with opacity based on eventOpacity setting
                                background: `${event.color}${Math.round(eventOpacity * 0.35 * 255).toString(16).padStart(2, '0')}`,
                                boxShadow: currentTheme.eventBlock.shadow,
                                border: template.eventBlockNoBorders ? 'none' : currentTheme.eventBlock.border,
                                overflow: 'hidden',
                              };
                            } else if (template.themeFamily === 'glass') {
                              return {
                                backgroundColor: `${event.color}${Math.round(eventOpacity * 255).toString(16).padStart(2, '0')}`,
                                borderColor: template.eventBlockNoBorders ? 'transparent' : 'rgba(255,255,255,0.2)',
                                overflow: 'hidden',
                              };
                            } else {
                              return {
                                backgroundColor: event.color + Math.round(eventOpacity * 255).toString(16).padStart(2, '0'),
                                borderColor: 'rgba(0,0,0,0.1)',
                              };
                            }
                          })()),
                          ...(isOverlapping
                            ? {
                                borderColor: 'rgba(239, 68, 68, 0.95)',
                                borderWidth: '3px',
                                boxShadow: '0 12px 26px rgba(239, 68, 68, 0.35)',
                              }
                            : isSelected
                            ? {
                                borderColor: selectedBorderColor,
                                borderWidth: '3px',
                                boxShadow: '0 10px 24px rgba(37, 99, 235, 0.25)',
                              }
                            : {}),
                          ...(shouldHideBorder ? { borderColor: 'transparent' } : {}),
                          ...(showEventOnboarding ? {
                            borderColor: 'rgba(6, 182, 212, 0.6)',
                            borderStyle: 'dotted',
                            borderWidth: '3px',
                            boxShadow: '0 0 0 1px rgba(6, 182, 212, 0.25)',
                          } : {}),
                          color: '#fff',
                          zIndex: isDragging ? 30 : isSelected ? 20 : 10,
                          userSelect: isDragging ? 'none' : 'auto',
                        }}
                      >
                        {/* Backdrop blur layer for acrylic/solid-grain/glass themes */}
                        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain' || template.themeFamily === 'glass') && (
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
                                // Solid-grain uses lighter blur (8px) since canvas provides presence
                                // Acrylic uses heavier blur (30px) for frosted effect
                                backdropFilter: template.themeFamily === 'solid-grain'
                                  ? `blur(${8 * blurScale}px)`
                                  : `blur(${12 * blurScale}px)`,
                                WebkitBackdropFilter: template.themeFamily === 'solid-grain'
                                  ? `blur(${8 * blurScale}px)`
                                  : `blur(${12 * blurScale}px)`,
                              }),
                              pointerEvents: 'none',
                              borderRadius: 'inherit',
                              zIndex: -1,
                            }}
                          />
                        )}
                        {/* Grain texture overlay for acrylic and solid-grain themes (grain on blocks only) */}
                        {(template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain') && (
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
                        {!hideTextContent && (
                          <div
                            className="flex flex-col min-w-0 overflow-hidden gap-0 relative z-10"
                            style={{
                              textAlign: template.textAlignHorizontal,
                              // Add padding for italic text overhang, especially when right-aligned
                              paddingRight: (template.titleItalic || template.subtitleItalic) && template.textAlignHorizontal === 'right' ? '0.15em' : undefined,
                            }}
                          >
                            <div
                              className="leading-none uppercase tracking-wide"
                              style={{
                                wordBreak: 'keep-all',
                                overflowWrap: 'normal',
                                fontSize: `${template.titleFontSize}px`,
                                fontFamily: template.titleFont,
                                fontWeight: template.titleBold ? 700 : 400,
                                fontStyle: template.titleItalic ? 'italic' : 'normal',
                                color: template.titleTextColor || (template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain'
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
                                className="opacity-90"
                                style={{
                                  fontSize: `${template.subtitleFontSize}px`,
                                  fontFamily: template.subtitleFont,
                                  fontWeight: template.subtitleBold ? 600 : 400,
                                  fontStyle: template.subtitleItalic ? 'italic' : 'normal',
                                  color: template.subtitleTextColor || (template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain'
                                    ? currentTheme.eventBlock.subtitleColor
                                    : '#1f2937'),
                                  marginTop: '2px'
                                }}
                              >
                                {event.classType === 'Custom' ? event.customClassType : event.classType}
                              </div>
                            )}
                          </div>
                        )}

                        {!hideTextContent && !template.compact && (
                          <div
                            className="opacity-90 flex flex-col gap-0 min-w-0 overflow-hidden"
                            style={{
                              fontSize: `${template.detailsFontSize}px`,
                              fontFamily: template.detailsFont,
                              fontWeight: template.detailsBold ? 600 : 400,
                              fontStyle: template.detailsItalic ? 'italic' : 'normal',
                              color: template.detailsTextColor || (template.themeFamily === 'acrylic' || template.themeFamily === 'solid-grain'
                                ? currentTheme.eventBlock.detailsColor
                                : '#374151'),
                              marginTop: '2px',
                              textAlign: template.textAlignHorizontal,
                              // Add padding for italic text overhang, especially when right-aligned
                              paddingRight: template.detailsItalic && template.textAlignHorizontal === 'right' ? '0.15em' : undefined,
                            }}
                          >
                            {template.showTime && (
                              <div className={`flex items-center gap-1 font-mono opacity-80 w-full ${template.textAlignHorizontal === 'center' ? 'justify-center' : template.textAlignHorizontal === 'right' ? 'justify-end' : ''}`}>
                                 <span>{event.startTime} - {event.endTime}</span>
                              </div>
                            )}

                            {template.showLocation && event.location && (
                              template.textAlignHorizontal === 'left' ? (
                                <div className="flex items-start gap-1 opacity-75 w-full">
                                  <MapPin size={10} className="mt-0.5 shrink-0" />
                                  <span className="break-words">{event.location}</span>
                                </div>
                              ) : (
                                <div className={`opacity-75 w-full ${template.textAlignHorizontal === 'center' ? 'text-center' : 'text-right'}`}>
                                  <MapPin size={10} className="inline-block align-middle mr-1" />
                                  <span className="break-words">{event.location}</span>
                                </div>
                              )
                            )}

                            {(event.includeNotes ?? template.showNotes) && event.notes && (
                               <div className={`flex items-start gap-1 opacity-75 border-t border-black/10 w-full ${template.textAlignHorizontal === 'center' ? 'justify-center' : template.textAlignHorizontal === 'right' ? 'justify-end' : ''}`} style={{ marginTop: '2px', paddingTop: '2px' }}>
                                 <AlignLeft size={10} className="mt-0.5 shrink-0" />
                                 <span className="line-clamp-4 leading-tight break-words">{event.notes}</span>
                               </div>
                            )}
                          </div>
                        )}
                      </div>

                      {showEventOnboarding && (
                        <div
                          data-component="OnboardingCallout-eventBlock"
                          className="absolute z-[200]"
                          style={{
                            left: 'calc(100% + 12px)',
                            top: `${calloutTopPx}px`,
                            transform: 'translateY(-50%)',
                            pointerEvents: 'auto',
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-0">
                            {/* Arrow pointing left towards the event block */}
                            <div
                              style={{
                                width: 0,
                                height: 0,
                                borderTop: '6px solid transparent',
                                borderBottom: '6px solid transparent',
                                borderRight: '8px solid rgba(6, 182, 212, 0.4)',
                              }}
                            />
                            <div className="relative group bg-cyan-500/20 border border-cyan-500/35 rounded-lg p-2.5 text-xs text-cyan-200/90 backdrop-blur-md max-w-[350px]">
                              {eventBlockOnboardingMessage ? (
                                <p className="whitespace-nowrap">
                                  <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-cyan-400" />
                                  {eventBlockOnboardingMessage}
                                </p>
                              ) : (
                                <p className="break-words">
                                  <MousePointerClick size={13} className="inline-block mr-1.5 -mt-0.5 text-cyan-400" />
                                  Click on block to edit color/font/layout.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

        {/* CALENDAR FOOTER - Branding watermark */}
        {/* <div data-component="CalendarFooter" className="mt-4 flex justify-center items-center opacity-50 text-xs">
          <span>Generated by ScheduleStyler</span>
        </div> */}
      </div>
    </div>
    </OuterWrapper>
  );
};
