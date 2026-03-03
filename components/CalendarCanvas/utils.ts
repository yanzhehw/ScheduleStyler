import { CalendarEvent, TemplateConfig } from '../../types';

// =============================================================================
// Dimension Constants & Utilities
// =============================================================================

/** Absolute minimum width per day column in pixels */
export const ABSOLUTE_MIN_BLOCK_WIDTH = 60;

/** Fixed layout dimensions */
export const HEADER_HEIGHT = 40;
export const FOOTER_HEIGHT = 40;
export const GRID_PADDING = 64; // p-8 = 32px * 2
export const TIME_COLUMN_WIDTH = 48; // w-12 = 48px

/** Aspect ratio constants */
export const LANDSCAPE_RATIO = 16 / 9;  // ~1.778 (slider = 0)
export const PORTRAIT_RATIO = 9 / 16;   // ~0.5625 (slider = 1)

/** Event block internal padding (left-1 right-1 + p-1.5 = 4px + 6px each side) */
const EVENT_BLOCK_PADDING = 30; // Account for block padding, margins, and tracking-wide letter-spacing

/**
 * Calculate minimum width per column needed to keep text to max 2 lines.
 *
 * Each field in the event block should wrap at most once (2 lines max).
 * Returns the minimum column width that satisfies this for the longest text.
 */
export const calculateMinBlockWidth = (
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
export const calculateCanvasDimensions = (
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
export const roundToNearestHalfHour = (timeInHours: number): number => {
  return Math.round(timeInHours * 2) / 2;
};

export const parseTimeToHours = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + (minutes || 0) / 60;
};

export const formatTimeFromHours = (timeInHours: number): string => {
  const clamped = Math.max(0, Math.min(24, timeInHours));
  const hours = Math.floor(clamped);
  const minutes = clamped - hours >= 0.5 ? 30 : 0;
  return `${hours.toString().padStart(2, '0')}:${minutes === 0 ? '00' : '30'}`;
};

// Calculate minimum height needed for an event's content in pixels
// Uses line-height multiplier of 1.4 because CSS renders text with line-height: 1.4
// (standard typographic spacing - actual rendered line box = fontSize × 1.4)
export const calculateMinEventHeight = (
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
  const locationLineHeight = 1.25; // Matches CSS leading-tight for location field

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

    // Location height - uses locationLineHeight (leading-tight) for tighter spacing
    if (template.showLocation && event.location) {
      const locationHeight = detailsFontSize * locationLineHeight + 2;
      totalHeight += locationHeight;
      breakdown.push({
        component: 'location',
        height: locationHeight,
        detail: `"${event.location}" - ${detailsFontSize}px × ${locationLineHeight} + 2px margin`,
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
