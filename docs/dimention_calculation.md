# Dimension Calculation Pipeline

This document details how CalendarCanvas calculates minimum dimensions to ensure event block content fits without overflow.

## Overview

The dimension calculation system ensures that:
1. **Event text never overflows** - Each event block is tall enough for its content
2. **Text wraps reasonably** - Each text field wraps at most 2 lines
3. **Aspect ratio is respected** - Canvas adapts to user's aspect ratio slider while honoring content minimums

---

## 1. Dynamic Hour Height Calculation

**Purpose:** Find the standardized pixels-per-hour that ensures ALL event blocks can display their content.

### Algorithm

```
File: components/CalendarCanvas.tsx (lines 468-497)
Function: hourHeight useMemo
```

**Step 1: Calculate each event's minimum content height**

For each event, `calculateMinEventHeight()` estimates the pixel height needed:

```typescript
// Line 288-336
const calculateMinEventHeight = (event, template, showFullTitle) => {
  // Each text field uses its own font size from template
  const titleFontSize = template.titleFontSize;       // Title text
  const subtitleFontSize = template.subtitleFontSize; // Class type label
  const detailsFontSize = template.detailsFontSize;   // Time, location, notes

  // Line-height multiplier (see explanation below)
  const lineHeight = 1.4;
  const locationLineHeight = 1.25; // Matches CSS leading-tight for location field

  let totalHeight = 16; // Base padding (p-1.5 = 6px × 2 = 12px, plus ~4px internal margins)

  // Title: estimate lines based on character count
  const titleLines = Math.ceil(title.length / 12);
  totalHeight += titleFontSize * lineHeight * Math.min(titleLines, 2);

  // Non-compact mode adds class type, time, location, notes
  if (!template.compact) {
    if (template.showClassType) totalHeight += subtitleFontSize * lineHeight + 2;
    if (template.showTime) totalHeight += detailsFontSize * lineHeight + 2;
    if (template.showLocation && event.location) totalHeight += detailsFontSize * locationLineHeight + 2;
    if (showNotes && event.notes) totalHeight += detailsFontSize * lineHeight * 2 + 8;
  }

  return totalHeight;
};
```

**Step 2: Calculate required hour height for each event**

```typescript
// Line 476-492
events.forEach(event => {
  const minContentHeight = calculateMinEventHeight(event, template, showFullTitle);

  // Get event duration (aligned to half-hour grid)
  const durationHours = alignedEnd - alignedStart;  // minimum 0.5

  // Required formula:
  // eventHeight = durationHours × hourHeight
  // We need: eventHeight >= minContentHeight
  // Therefore: hourHeight >= minContentHeight / durationHours

  const requiredHourHeight = minContentHeight / durationHours;
  maxRequiredHourHeight = Math.max(maxRequiredHourHeight, requiredHourHeight);
});
```

**Step 3: Apply bounds**

```typescript
// Line 496
return Math.max(baseHourHeight, Math.min(maxRequiredHourHeight, 200));
// baseHourHeight = 60px (minimum)
// 200px = maximum to prevent excessively tall grids
```

### Key Insight

The **most constrained event** (shortest duration with most content) determines the grid's hour height. A 30-minute event with a long title will require a higher hourHeight than a 2-hour event with the same title.

---

## 2. Minimum Block Width Calculation

**Purpose:** Ensure text fields wrap at most 2 lines within each day column.

### Algorithm

```
File: components/CalendarCanvas.tsx (lines 108-161)
Function: calculateMinBlockWidth()
```

**Character Width Estimation:**

```typescript
// Title uses uppercase with letter-spacing → wider characters
const titleCharWidth = titleFontSize * 0.8;

// Details use normal case
const detailCharWidth = detailsFontSize * 0.55;
```

**Width Calculation Per Event:**

```typescript
events.forEach(event => {
  // Find the LONGEST WORD in each field
  // (ensures no word-break within a word)

  // Title
  const longestWordLength = Math.max(...title.split(/\s+/).map(w => w.length));
  const titleWidth = longestWordLength * titleCharWidth;

  // Class type
  const classTypeWidth = longestClassWord * detailCharWidth;

  // Location (includes 14px for icon)
  const locationWidth = (longestLocationWord * detailCharWidth) + 14;

  // Required width = max of all fields + padding
  const requiredWidth = Math.max(titleWidth, classTypeWidth, locationWidth)
                        + EVENT_BLOCK_PADDING;  // 30px

  maxRequiredWidth = Math.max(maxRequiredWidth, requiredWidth);
});

return maxRequiredWidth;  // minimum: ABSOLUTE_MIN_BLOCK_WIDTH = 60px
```

### Key Insight

The width is determined by the **longest single word** across all events. This prevents mid-word breaks while allowing natural line wrapping at word boundaries.

---

## 3. Canvas Dimension Calculation

**Purpose:** Combine content minimums with aspect ratio slider to produce final canvas size.

### Constants

```typescript
// Line 86-97
const ABSOLUTE_MIN_BLOCK_WIDTH = 60;   // Minimum day column width
const HEADER_HEIGHT = 40;               // Day header row
const FOOTER_HEIGHT = 40;               // Bottom padding
const GRID_PADDING = 64;                // p-8 = 32px × 2
const TIME_COLUMN_WIDTH = 48;           // w-12 = 48px

// Aspect ratios
const LANDSCAPE_RATIO = 16 / 9;         // slider = 0 → ~1.778
const PORTRAIT_RATIO = 9 / 16;          // slider = 1 → ~0.5625
```

### Algorithm

```
File: components/CalendarCanvas.tsx (lines 178-264)
Function: calculateCanvasDimensions()
```

**Step 1: Calculate minimum grid dimensions**

```typescript
const minGridWidth = numDays * minBlockWidth;
const minGridHeight = hourRange * contentBasedHourHeight;

const minCanvasWidth = minGridWidth + TIME_COLUMN_WIDTH + GRID_PADDING;
const minCanvasHeight = minGridHeight + HEADER_HEIGHT + FOOTER_HEIGHT + GRID_PADDING;
```

**Step 2: Calculate natural (content-driven) dimensions**

```typescript
const naturalGridWidth = Math.max(minGridWidth, numDays * 120);  // 120px preferred minimum
const naturalCanvasWidth = naturalGridWidth + TIME_COLUMN_WIDTH + GRID_PADDING;
const naturalCanvasHeight = naturalGridHeight + HEADER_HEIGHT + FOOTER_HEIGHT + GRID_PADDING;
```

**Step 3: Apply aspect ratio slider**

```typescript
const targetRatio = LANDSCAPE_RATIO + (PORTRAIT_RATIO - LANDSCAPE_RATIO) * aspectRatioSlider;

if (targetRatio > naturalRatio) {
  // Target is WIDER → expand width
  finalWidth = naturalCanvasHeight * targetRatio;

} else if (targetRatio < naturalRatio) {
  // Target is NARROWER → try shrinking width
  const targetWidth = naturalCanvasHeight * targetRatio;

  if (targetWidth >= minCanvasWidth) {
    // Can shrink without violating minimum
    finalWidth = targetWidth;

    // Compensation: narrower columns cause more text wrap → add extra height
    const widthCompressionRatio = naturalCanvasWidth / targetWidth;
    const extraHeightFactor = Math.sqrt(widthCompressionRatio) - 1;
    const extraHeight = minGridHeight * extraHeightFactor * 0.3;
    finalHeight = naturalCanvasHeight + extraHeight;

  } else {
    // Can't shrink enough → expand height instead
    finalWidth = minCanvasWidth;
    finalHeight = minCanvasWidth / targetRatio;
  }
}
```

---

## 4. Background & Card Dimensions

### Background Container

```
File: components/CalendarCanvas.tsx (lines 607-653)
```

The background uses a **different aspect ratio range**:
- Slider = 0 → 16:9 (landscape)
- Slider = 1 → 9:19.5 (portrait, more extreme)

```typescript
const PORTRAIT_RATIO = 9 / 19.5;  // ~0.462 for background
```

Background dimensions must be large enough to contain the calendar card with insets applied.

### Calendar Card Insets

```typescript
// Line 656-677
const insets = template.calendarCardInsets;  // { top, bottom, left, right } in %

const cardWidthPercent = (100 - insets.left - insets.right) / 100;
const cardHeightPercent = (100 - insets.top - insets.bottom) / 100;

const cardWidth = bgWidth * cardWidthPercent;
const cardHeight = bgHeight * cardHeightPercent;

const cardX = bgWidth * (insets.left / 100);
const cardY = bgHeight * (insets.top / 100);
```

---

## 5. Behavior During Resizing

### Aspect Ratio Slider Change

When the user moves the aspect ratio slider:

1. `calculateCanvasDimensions()` recalculates with new `aspectRatioSlider` value
2. Width may shrink (if going toward portrait) or expand (if going toward landscape)
3. If width would go below `minCanvasWidth`, height expands instead
4. **Text wrapping compensation:** When width compresses, extra height is added:
   ```typescript
   const extraHeightFactor = Math.sqrt(widthCompressionRatio) - 1;
   ```
   This uses square root to provide diminishing returns—a 2x width compression adds ~41% extra height factor, not 100%.

### Card Inset Resize (Edge Dragging)

When the user drags calendar card edges in ExportStep:

1. `calendarCardInsets` values change (0-45% per edge)
2. Card dimensions recalculate as percentage of background
3. The **internal grid** scales to fit within the new card bounds
4. Hour height and block width minimums are preserved—if the card becomes too small, content may overflow (this is a user choice)

---

## 6. Font Size Changes

When `template.titleFontSize` or `template.detailsFontSize` changes:

### Effect on Height

```typescript
// calculateMinEventHeight() uses font sizes directly
totalHeight += baseFontSize * lineHeight * titleLines;
totalHeight += smallFontSize * lineHeight;
```

- Larger fonts → taller minimum content height
- This increases `requiredHourHeight` for each event
- Grid expands vertically to accommodate

### Effect on Width

```typescript
// calculateMinBlockWidth() scales character width with font size
const titleCharWidth = titleFontSize * 0.8;
const detailCharWidth = detailsFontSize * 0.55;
```

- Larger fonts → wider characters → longer words need more space
- `minBlockWidth` increases
- Grid expands horizontally (or aspect ratio adjustment kicks in)

---

## 7. Text Wrapping Behavior

### Width Constraint Strategy

The width calculation focuses on **preventing mid-word breaks**:

```typescript
// Find longest word, not longest line
const longestWordLength = Math.max(...words.map(w => w.length));
```

This means:
- Short words can wrap to multiple lines ✓
- Long words never break mid-word ✓
- If a word is very long (e.g., "Supercalifragilisticexpialidocious"), the entire grid widens

### Height Constraint Strategy

The height calculation uses a **rough estimate**:

```typescript
const titleLines = Math.ceil(title.length / 12);  // ~12 chars per line estimate
```

This is conservative—it assumes narrow columns. The actual rendered text may fit in fewer lines if columns are wider than minimum.

### Compact Mode

When `template.compact = true`:
- Time, location, and notes fields are hidden
- `calculateMinEventHeight()` returns a smaller value
- Grid can be shorter overall

---

## Summary: Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        INPUT                                    │
│  events[], template (fonts, visibility flags, aspectRatio)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  calculateMinBlockWidth()                                       │
│  → Find longest word across all events                          │
│  → Multiply by char width (scaled by font size)                 │
│  → Add padding → minBlockWidth                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  calculateMinEventHeight() (for each event)                     │
│  → Sum up height for each visible field                         │
│  → Scale by font size and line height                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  hourHeight useMemo                                             │
│  → For each event: requiredHourHeight = minHeight / duration    │
│  → Take maximum across all events                               │
│  → Clamp to [60, 200] range                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  calculateCanvasDimensions()                                    │
│  → minGridWidth = numDays × minBlockWidth                       │
│  → minGridHeight = hourRange × hourHeight                       │
│  → Apply aspect ratio slider with compression compensation      │
│  → Return { width, height, gridWidth, gridHeight }              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  backgroundDimensions useMemo                                   │
│  → Calculate bg aspect ratio (16:9 to 9:19.5)                   │
│  → Ensure bg is large enough to contain content                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  cardDimensions useMemo                                         │
│  → Apply calendarCardInsets to background                       │
│  → Calculate card position and size                             │
│  → Calculate internal grid dimensions                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Constants Reference

| Constant | Value | Purpose |
|----------|-------|---------|
| `ABSOLUTE_MIN_BLOCK_WIDTH` | 60px | Hard minimum day column width |
| `HEADER_HEIGHT` | 40px | Day header row height |
| `FOOTER_HEIGHT` | 40px | Bottom padding height |
| `GRID_PADDING` | 64px | Total horizontal padding (32px × 2) |
| `TIME_COLUMN_WIDTH` | 48px | Time labels column width |
| `EVENT_BLOCK_PADDING` | 30px | Internal padding + margins in event blocks |
| `baseHourHeight` | 60px | Default/minimum pixels per hour |
| `maxHourHeight` | 200px | Maximum pixels per hour |
| `titleCharWidth` | fontSize × 0.8 | Width per uppercase character |
| `detailCharWidth` | fontSize × 0.55 | Width per normal character |
| `lineHeight` | 1.4 | Default line-height multiplier for text fields |
| `locationLineHeight` | 1.25 | Line-height for location field (CSS `leading-tight`) |
