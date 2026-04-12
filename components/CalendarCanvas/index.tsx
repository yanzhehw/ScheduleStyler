import React, { useMemo, useRef, useEffect, useState } from 'react';
import { CalendarEvent, TemplateConfig, SelectableExportComponent, ResizeEdge, OnboardingComponent, getTextColorPreset } from '../../types';
import { MoveUp, MoveDown, MousePointerClick } from 'lucide-react';
import { getTheme } from '../../themes';
import { useBackgrounds } from '../../contexts/BackgroundsContext';
import { currentTheme as siteTheme } from '../../lib/site_themes';
import { SHOW_WATERMARK } from '../../config';

import {
  calculateMinBlockWidth,
  calculateCanvasDimensions,
  calculateMinEventHeight,
  roundToNearestHalfHour,
  parseTimeToHours,
  formatTimeFromHours,
  TIME_COLUMN_WIDTH,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  GRID_PADDING,
  LANDSCAPE_RATIO,
  PORTRAIT_RATIO,
} from './utils';
import { BackgroundLayer } from './BackgroundLayer';
import { GridLayout } from './GridLayout';
import { EventBlock } from './EventBlock';

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
  /** Callback when resize drag starts. element is the edge div for attaching touch listeners. */
  onResizeStart?: (edge: ResizeEdge, mousePos: { x: number; y: number }, element?: HTMLElement) => void;
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
    event: CalendarEvent;
  } | null>(null);
  const onEventClickRef = useRef(onEventClick);
  onEventClickRef.current = onEventClick;
  const justHandledDragRef = useRef(false);
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

  // Clear hovered slot when pointer leaves grid bounds (reliable even with fast mouse moves)
  useEffect(() => {
    if (!hoveredSlot || !dayColumnsRef.current) return;
    const handleDocMouseMove = (e: MouseEvent) => {
      const rect = dayColumnsRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setHoveredSlot(null);
      }
    };
    document.addEventListener('mousemove', handleDocMouseMove);
    return () => document.removeEventListener('mousemove', handleDocMouseMove);
  }, [hoveredSlot]);

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

  // Calculate visible days and their actual day indices, respecting weekend toggle and first-day rotation
  const { visibleDays, visibleDayIndices } = useMemo(() => {
    const hasWeekendEvents = events.some(e => e.dayIndex >= 5);
    const showWeekend = template.includeWeekend || hasWeekendEvents;
    const totalDays = showWeekend ? 7 : 5;
    const firstDay = template.firstDayOfWeek ?? 0;

    // Build rotated day indices starting from firstDayOfWeek
    const allIndices = Array.from({ length: 7 }, (_, i) => (firstDay + i) % 7);
    // Filter to only visible days (exclude weekend indices 5,6 if not showing weekend)
    const filteredIndices = showWeekend
      ? allIndices
      : allIndices.filter(idx => idx < 5);
    const days = filteredIndices.map(idx => ALL_DAYS[idx]);

    return { visibleDays: days, visibleDayIndices: filteredIndices };
  }, [events, template.includeWeekend, template.firstDayOfWeek]);

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
      }
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

  // Get the current theme object
  const currentTheme = useMemo(() => {
    return getTheme(template.themeFamily, template.themeVariant, template.themeSubVariant);
  }, [template.themeFamily, template.themeVariant, template.themeSubVariant]);

  // Get the text color preset
  const textColorPreset = useMemo(() => {
    return getTextColorPreset(template.textColorPreset);
  }, [template.textColorPreset]);

  // Theme styles (all themes are dark now)
  const themeClasses = useMemo(() => {
    const family = template.themeFamily;
    const hasCustomBg = template.backgroundType !== 'none';

    // For acrylic and solid-grain, we'll handle background via inline styles
    if (family === 'acrylic' || family === 'solid-grain') {
      return 'text-gray-100 border-gray-700';
    }

    // Check if it's glass family
    if (family === 'glass') {
      return hasCustomBg
        ? 'backdrop-blur-xl text-white border-white/20'
        : 'bg-white/10 backdrop-blur-xl text-white border-white/20';
    }

    // Default to dark - background handled via inline styles in canvasStyles
    return 'text-gray-100 border-gray-700';
  }, [template.themeFamily, template.backgroundType]);

  // Grid line color based on gridLineStyle setting
  const gridBorderColor = useMemo(() => {
    return template.gridLineStyle === 'bright'
      ? 'border-gray-300'
      : 'border-gray-700';
  }, [template.gridLineStyle]);

  // Header text color - use custom color or fall back to preset
  const headerTextColor = useMemo(() => {
    if (template.headerTextColor) {
      return template.headerTextColor;
    }
    return textColorPreset.headerColor;
  }, [template.headerTextColor, textColorPreset]);

  const effectiveScale = Math.max(0.25, visualScale ?? 1);
  const blurScale = 1 / effectiveScale;

  // All themes are dark now, so this is always false
  const isLightTheme = false;

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
    const LANDSCAPE_RATIO_BG = 16 / 9;    // ~1.778 (slider = 0)
    const PORTRAIT_RATIO_BG = 9 / 19.5;   // ~0.462 (slider = 1)
    const bgTargetRatio = LANDSCAPE_RATIO_BG + (PORTRAIT_RATIO_BG - LANDSCAPE_RATIO_BG) * template.aspectRatio;

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
      // Prevent iPadOS Safari from auto-adjusting text sizes during zoom
      WebkitTextSizeAdjust: '100%',
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
      background: isLight ? '#ffffff' : `var(--calendar-card-background, ${siteTheme.surface.calendarCard})`,
    };
  }, [template.borderRadius, template.themeFamily, template.backgroundType, template.themeVariant, template.theme, cardDimensions, currentTheme]);

  const addSlotStyle = useMemo(() => {
    return {
      background: 'var(--add-slot-background)',
      borderColor: 'var(--add-slot-border-color)',
      boxShadow: 'var(--add-slot-box-shadow)',
      transform: 'translateY(1px)',
    } as React.CSSProperties;
  }, []);

  const addSlotTextColor = 'var(--add-slot-text-color)';
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
      const colIndex = Math.min(visibleDays.length - 1, Math.max(0, rawDayIndex));
      const actualDayIndex = visibleDayIndices[colIndex];

      const hourHeightPx = rect.height / hourRange;
      const rawStart = startHour + y / hourHeightPx;
      const snappedStart = roundToNearestHalfHour(rawStart);
      const maxStart = startHour + hourRange - dragInfo.durationHours;
      const clampedStart = Math.min(maxStart, Math.max(startHour, snappedStart));
      const clampedEnd = clampedStart + dragInfo.durationHours;

      dragInfo.latest = {
        startTime: formatTimeFromHours(clampedStart),
        endTime: formatTimeFromHours(clampedEnd),
        dayIndex: actualDayIndex,
      };
      onEventTimeChange(dragInfo.eventId, dragInfo.latest);
    };

    const handleUp = () => {
      const dragInfo = dragInfoRef.current;
      if (dragInfo) {
        const latest = dragInfo.latest ?? dragInfo.original;
        const didMove =
          latest.startTime !== dragInfo.original.startTime ||
          latest.endTime !== dragInfo.original.endTime ||
          latest.dayIndex !== dragInfo.original.dayIndex;

        if (didMove && onEventDragEnd) {
          onEventDragEnd(dragInfo.eventId, dragInfo.original, latest);
        } else if (!didMove && onEventClickRef.current) {
          onEventClickRef.current(dragInfo.event);
        }
      }
      setDraggingEventId(null);
      dragInfoRef.current = null;
      justHandledDragRef.current = true;
      requestAnimationFrame(() => {
        justHandledDragRef.current = false;
      });
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
  }, [draggingEventId, onEventDragEnd, onEventTimeChange, hourRange, startHour, visibleDays.length, visibleDayIndices]);

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
    const colIndex = Math.min(visibleDays.length - 1, Math.max(0, Math.floor(x / dayWidth)));
    const actualDayIndex = visibleDayIndices[colIndex];
    const hourHeightPx = rect.height / hourRange;
    const rawHour = startHour + y / hourHeightPx;
    const slotStart = Math.min(startHour + hourRange - 1, Math.max(startHour, Math.floor(rawHour)));

    if (!isSlotEmpty(actualDayIndex, slotStart)) {
      if (hoveredSlot) setHoveredSlot(null);
      return;
    }

    if (!hoveredSlot || hoveredSlot.dayIndex !== actualDayIndex || hoveredSlot.startHour !== slotStart) {
      setHoveredSlot({ dayIndex: actualDayIndex, startHour: slotStart });
    }
  };

  const handleEventMouseDown = (event: CalendarEvent, e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onEventTimeChange) return;
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
      event,
    };
    setDraggingEventId(event.id);
    setHoveredSlot(null);
    e.preventDefault();
    e.stopPropagation();
  };

  // Touch handler for mobile dragging
  const handleEventTouchStart = (event: CalendarEvent, e: React.TouchEvent<HTMLDivElement>) => {
    if (!interactive || !onEventTimeChange) return;
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
      event,
    };
    setDraggingEventId(event.id);
    setHoveredSlot(null);
  };

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
        outerBgStyle.background = `var(--calendar-card-background, ${siteTheme.surface.calendarCard})`;
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
          {template.backgroundType !== 'none' && (
            <BackgroundLayer
              template={template}
              backgroundImageUrl={backgroundImageUrl}
            />
          )}
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
              className="absolute top-3 right-3 z-[210] rounded-lg border border-white/15 bg-slate-900/50 px-3 py-2 text-xs text-white/90 shadow-lg backdrop-blur-md transition hover:border-white/30 hover:bg-slate-900/70 hover:text-white"
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

              {/* Resize handles at center of each edge */}
              {/* Top handle */}
              <div
                style={{
                  position: 'absolute',
                  left: cardLeft + (cardRight - cardLeft) / 2 - 16,
                  top: cardTop - 3,
                  width: 32,
                  height: lineWidth + 6,
                  borderRadius: 4,
                  background: lineColor,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 202,
                }}
              />
              {/* Bottom handle */}
              <div
                style={{
                  position: 'absolute',
                  left: cardLeft + (cardRight - cardLeft) / 2 - 16,
                  top: cardBottom - 3,
                  width: 32,
                  height: lineWidth + 6,
                  borderRadius: 4,
                  background: lineColor,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 202,
                }}
              />
              {/* Left handle */}
              <div
                style={{
                  position: 'absolute',
                  left: cardLeft - 3,
                  top: cardTop + (cardBottom - cardTop) / 2 - 16,
                  width: lineWidth + 6,
                  height: 32,
                  borderRadius: 4,
                  background: lineColor,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 202,
                }}
              />
              {/* Right handle */}
              <div
                style={{
                  position: 'absolute',
                  left: cardRight - 3,
                  top: cardTop + (cardBottom - cardTop) / 2 - 16,
                  width: lineWidth + 6,
                  height: 32,
                  borderRadius: 4,
                  background: lineColor,
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 202,
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

              {/* Edge hit areas for resize - 30px for touch-friendly targets */}
              {/* Top edge */}
              <div
                data-component="ResizeEdge-top"
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardTop - 15,
                  width: topLineWidth,
                  height: 30,
                  cursor: 'n-resize',
                  zIndex: 201,
                  touchAction: 'none',
                }}
                onMouseEnter={() => onEdgeHover?.('top')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('top', { x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e: React.TouchEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const t = e.touches[0];
                  onResizeStart?.('top', { x: t.clientX, y: t.clientY }, e.currentTarget as HTMLElement);
                }}
              />
              {/* Bottom edge */}
              <div
                data-component="ResizeEdge-bottom"
                style={{
                  position: 'absolute',
                  left: topLineLeft,
                  top: cardBottom - 15,
                  width: topLineWidth,
                  height: 30,
                  cursor: 's-resize',
                  zIndex: 201,
                  touchAction: 'none',
                }}
                onMouseEnter={() => onEdgeHover?.('bottom')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('bottom', { x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e: React.TouchEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const t = e.touches[0];
                  onResizeStart?.('bottom', { x: t.clientX, y: t.clientY }, e.currentTarget as HTMLElement);
                }}
              />
              {/* Left edge */}
              <div
                data-component="ResizeEdge-left"
                style={{
                  position: 'absolute',
                  left: cardLeft - 15,
                  top: sideLineTop,
                  width: 30,
                  height: sideLineHeight,
                  cursor: 'ew-resize',
                  zIndex: 201,
                  touchAction: 'none',
                }}
                onMouseEnter={() => onEdgeHover?.('left')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('left', { x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e: React.TouchEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const t = e.touches[0];
                  onResizeStart?.('left', { x: t.clientX, y: t.clientY }, e.currentTarget as HTMLElement);
                }}
              />
              {/* Right edge */}
              <div
                data-component="ResizeEdge-right"
                style={{
                  position: 'absolute',
                  left: cardRight - 15,
                  top: sideLineTop,
                  width: 30,
                  height: sideLineHeight,
                  cursor: 'ew-resize',
                  zIndex: 201,
                  touchAction: 'none',
                }}
                onMouseEnter={() => onEdgeHover?.('right')}
                onMouseLeave={() => onEdgeHover?.(null)}
                onMouseDown={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onResizeStart?.('right', { x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e: React.TouchEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const t = e.touches[0];
                  onResizeStart?.('right', { x: t.clientX, y: t.clientY }, e.currentTarget as HTMLElement);
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
        if (!interactive || !window.matchMedia('(hover: hover)').matches) return;
        setHoveredComponent(getHoveredComponentFromTarget(e.target as HTMLElement));
      }}
      onMouseMove={(e) => {
        if (!interactive || !window.matchMedia('(hover: hover)').matches) return;
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
        // Toggle card selection when clicking on the card background (not on events/header/time column)
        const target = e.target as HTMLElement;
        const isEventBlock = target.closest('[data-component="EventBlock"]');
        const isDayHeader = target.closest('[data-component="DayHeader"]');
        const isTimeColumn = target.closest('[data-component="TimeColumn"]');
        const isEmptySlot = target.closest('[data-component="EmptySlot"]');

        if (!isEventBlock && !isDayHeader && !isTimeColumn && !isEmptySlot && interactive) {
          if (isCalendarCardSelected && onBlankClick) {
            onBlankClick();
          } else if (onCalendarCardSelect) {
            onCalendarCardSelect();
          }
        }
      }}
      onTouchEnd={(e: React.TouchEvent) => {
        // Toggle card selection when tapping on the card background (not on events/header/time column)
        const target = e.target as HTMLElement;
        const isEventBlock = target.closest('[data-component="EventBlock"]');
        const isDayHeader = target.closest('[data-component="DayHeader"]');
        const isTimeColumn = target.closest('[data-component="TimeColumn"]');
        const isEmptySlot = target.closest('[data-component="EmptySlot"]');

        if (!isEventBlock && !isDayHeader && !isTimeColumn && !isEmptySlot && interactive) {
          e.stopPropagation();
          if (isCalendarCardSelected && onBlankClick) {
            onBlankClick();
          } else if (onCalendarCardSelect) {
            onCalendarCardSelect();
          }
        }
      }}
    >
      {/* BACKGROUND LAYER - Renders background image or color (only when not using outer container) */}
      {template.backgroundType !== 'none' && !useOuterContainer && (
        <BackgroundLayer
          template={template}
          backgroundImageUrl={backgroundImageUrl}
        />
      )}

      {/* CALENDAR CONTENT - Wrapper for header + grid */}
      <div
        data-component="CalendarContent"
        className="relative z-10"
      >
        <GridLayout
          template={template}
          visibleDays={visibleDays}
          visibleDayIndices={visibleDayIndices}
          hours={hours}
          hourRange={hourRange}
          cardDimensions={cardDimensions}
          gridBorderColor={gridBorderColor}
          headerTextColor={headerTextColor}
          blurScale={blurScale}
          exportMode={exportMode}
          interactive={interactive}
          hoveredComponent={hoveredComponent}
          highlightMode={highlightMode}
          showDayHeaderHighlight={showDayHeaderHighlight}
          showTimeColumnHighlight={showTimeColumnHighlight}
          isOnboardingActive={isOnboardingActive}
          onHeaderClick={onHeaderClick}
          onTimeColumnClick={onTimeColumnClick}
          setHoveredComponent={setHoveredComponent}
          getHoveredComponentFromTarget={getHoveredComponentFromTarget}
          dayColumnsRef={dayColumnsRef}
          handleGridMouseMove={handleGridMouseMove}
          onGridMouseLeave={() => setHoveredSlot(null)}
          onBlankClick={onBlankClick}
          textColorPreset={textColorPreset}
          renderDayColumnContent={(actualDayIndex, colIndex) => {
            const hoveredSlotForDay = hoveredSlot?.dayIndex === actualDayIndex ? hoveredSlot : null;
            const slotTopPercent = hoveredSlotForDay
              ? ((hoveredSlotForDay.startHour - startHour) / hourRange) * 100
              : 0;
            const slotHeightPercent = (1 / hourRange) * 100;

            return (
              <EventBlock
                events={events}
                actualDayIndex={actualDayIndex}
                template={template}
                currentTheme={currentTheme}
                textColorPreset={textColorPreset}
                showFullTitle={showFullTitle}
                interactive={interactive}
                selectedEventId={selectedEventId}
                draggingEventId={draggingEventId}
                overlappingSet={overlappingSet}
                hideUnselectedBorders={hideUnselectedBorders}
                hideTextContent={hideTextContent}
                blurScale={blurScale}
                exportMode={exportMode}
                selectedBorderColor={selectedBorderColor}
                startHour={startHour}
                hourRange={hourRange}
                cardDimensions={cardDimensions}
                isOnboardingActive={isOnboardingActive}
                onboardingEventId={onboardingEventId}
                eventBlockOnboardingMessage={eventBlockOnboardingMessage}
                hoveredSlotForDay={hoveredSlotForDay}
                slotTopPercent={slotTopPercent}
                slotHeightPercent={slotHeightPercent}
                addSlotStyle={addSlotStyle}
                addSlotTextColor={addSlotTextColor}
                onEmptyBlockClick={onEmptyBlockClick}
                clearHoveredSlot={() => setHoveredSlot(null)}
                onEventClick={onEventClick}
                handleEventMouseDown={handleEventMouseDown}
                handleEventTouchStart={handleEventTouchStart}
                justHandledDragRef={justHandledDragRef}
                dragInfoRef={dragInfoRef}
                formatTimeFromHours={formatTimeFromHours}
                roundToNearestHalfHour={roundToNearestHalfHour}
              />
            );
          }}
        />

        {/* CALENDAR FOOTER - Branding watermark */}
        {SHOW_WATERMARK && (
          <div data-component="CalendarFooter" className="mt-4 flex justify-center items-center opacity-50 text-xs">
            <span>Generated by ScheduleStyler.com</span>
          </div>
        )}
      </div>
    </div>
    </OuterWrapper>
  );
};
