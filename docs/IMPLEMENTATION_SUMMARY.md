# ScheduleStyler Implementation Summary

This document summarizes the implementation of the CalendarCanvas component and Background Gallery system.

## CalendarCanvas Component

**File:** `components/CalendarCanvas.tsx`

### Overview
CalendarCanvas is the core rendering component that displays a styled weekly schedule view with customizable themes, backgrounds, and event styling.

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `events` | `CalendarEvent[]` | Array of calendar events to display |
| `template` | `TemplateConfig` | Configuration for styling (theme, fonts, colors, etc.) |
| `interactive` | `boolean` | Enable click/drag interactions |
| `exportMode` | `boolean` | Use solid backgrounds instead of backdrop-filter for image export |
| `hideTextContent` | `boolean` | Hide text in event blocks (for preview thumbnails) |
| `visualScale` | `number` | Scale factor for consistent blur effects |
| `isCalendarCardSelected` | `boolean` | Whether the calendar card is selected for resize |
| `onCalendarCardSelect` | `() => void` | Callback when card is clicked |
| `highlightMode` | `string` | Controls onboarding highlight visibility |

### Dimension Calculation System

The canvas uses a sophisticated dimension calculation system:

1. **Dynamic Hour Height:** Calculates minimum height per hour based on event content to prevent text overflow
2. **Minimum Block Width:** Ensures text wraps at most 2 lines per field
3. **Aspect Ratio Slider:** Interpolates between 16:9 (landscape) and 9:16 (portrait)

```typescript
// Aspect ratio interpolation
const LANDSCAPE_RATIO = 16 / 9;  // slider = 0
const PORTRAIT_RATIO = 9 / 16;   // slider = 1
const targetRatio = LANDSCAPE_RATIO + (PORTRAIT_RATIO - LANDSCAPE_RATIO) * aspectRatioSlider;
```

### Theme System

Supports multiple theme families with variants:

- **Acrylic:** Frosted glass effect with grain texture overlay
- **Glass:** Transparent with backdrop blur
- **Light/Dark:** Solid background themes

Each theme family can have extended variants accessed via `themeSubVariant`:
- Thin Light Frost
- Thin Dark Slate
- Thick Colored Silk
- Thick Colored Ocean

### Background and Calendar Card Layout

The canvas uses a two-layer layout system:

1. **Background Container:** Dimensions controlled by `template.aspectRatio` slider (0=16:9, 1=9:19.5)
2. **Calendar Card:** Positioned within background using `template.calendarCardInsets`

```typescript
// Background dimensions from aspect ratio slider
const bgTargetRatio = LANDSCAPE_RATIO + (PORTRAIT_RATIO - LANDSCAPE_RATIO) * template.aspectRatio;

// Card dimensions from insets (percentage-based)
const cardWidth = bgWidth * (100 - insets.left - insets.right) / 100;
const cardHeight = bgHeight * (100 - insets.top - insets.bottom) / 100;
```

The `calendarCardInsets` type:
```typescript
calendarCardInsets: {
  top: number;     // 0-50 percentage from top
  bottom: number;  // 0-50 percentage from bottom
  left: number;    // 0-50 percentage from left (symmetric with right)
  right: number;   // 0-50 percentage from right (symmetric with left)
}
```

### Event Block Rendering

Event blocks support:
- Individual font sizes (`titleFontSize`, `subtitleFontSize`, `detailsFontSize`)
- Custom text colors per section
- Acrylic/glass backdrop blur effects
- Optional borders (`eventBlockNoBorders`)
- Export mode fallback styling (no backdrop-filter)

### Export Mode

When `exportMode={true}`:
- Replaces `backdrop-filter` with semi-transparent solid backgrounds
- Ensures compatibility with `html2canvas` for image export
- Gradient overlays simulate frosted glass appearance

---

## Calendar Card Edge Resizing

**File:** `components/ExportStep.tsx`, `components/CalendarCanvas.tsx`

### Overview

Interactive edge-drag resizing allows users to adjust the calendar card size within the background container on the Export step.

### New Types

```typescript
// types.ts
export type SelectableExportComponent = 'none' | 'dayHeader' | 'timeColumn' | 'calendarCard';
export type OnboardingComponent = 'calendarCard' | 'dayHeader' | 'timeColumn' | 'eventBlock';
export type ResizeEdge = 'top' | 'bottom' | 'left' | 'right' | null;
```

### CalendarCanvas Props for Selection/Resize

| Prop | Type | Description |
|------|------|-------------|
| `isCalendarCardSelected` | `boolean` | Whether the calendar card is currently selected |
| `onCalendarCardSelect` | `() => void` | Callback when card is clicked for selection |
| `hoveredResizeEdge` | `ResizeEdge` | Currently hovered edge for cursor changes |
| `onEdgeHover` | `(edge: ResizeEdge) => void` | Callback when hovering over resize edges |
| `onResizeStart` | `(edge, mousePos) => void` | Callback when starting edge drag |
| `onBlankClick` | `() => void` | Callback when clicking outside the card (deselect) |
| `highlightMode` | `'none' \| 'all' \| SelectableExportComponent` | Controls onboarding highlight visibility |

### Resize Behavior

- **Horizontal (left/right):** Symmetric resize - both edges move together, keeping card centered
- **Vertical (top/bottom):** Independent resize - each edge moves separately
- **Clamping:** Insets clamped to 0-45%, minimum 20% card size remaining

```typescript
// Symmetric horizontal resize
if (edge === 'left' || edge === 'right') {
  const deltaPercent = (deltaX / bgWidth) * 100;
  newInsets.left = clamp(startInsets.left + deltaPercent, 0, 45);
  newInsets.right = newInsets.left; // symmetric
}

// Independent vertical resize
if (edge === 'top') {
  newInsets.top = clamp(startInsets.top + deltaYPercent, 0, 45);
}
if (edge === 'bottom') {
  newInsets.bottom = clamp(startInsets.bottom - deltaYPercent, 0, 45);
}
```

### Selection UI

When the calendar card is selected:
- **Corner crop marks:** Dashed gray lines extending from each corner to canvas edges
- **Arrow indicators:** Show vertical adjustability on top-left
- **Edge hit areas:** Invisible 12px wide zones on each edge for drag detection
- **Cursor changes:** `n-resize` (top), `s-resize` (bottom), `ew-resize` (left/right)

When hovering (not selected):
- Blue ring effect on the calendar card wrapper

### Onboarding System

#### Per-Component States

Onboarding is tracked per component and persists in localStorage as either:
- `"true"` for fully completed
- A JSON object with per-component booleans

Components tracked:
- `calendarCard`
- `dayHeader`
- `timeColumn`
- `eventBlock`

#### Completion Rules

- **Day Header / Time Column / Calendar Card:** Marked complete when the user selects and then deselects the component. An OK button appears while selected.
- **Event Block:** A random event block is highlighted; completion occurs after the user selects that block and then deselects it (OK button also clears).

#### Callout Identifiers

Each onboarding callout exposes a `data-component` hook:
- `OnboardingCallout-calendarCard`
- `OnboardingCallout-dayHeader`
- `OnboardingCallout-timeColumn`
- `OnboardingCallout-eventBlock`

#### Debug Toggle

`DETECT_IF_ON_BOARDED` in `components/ExportStep.tsx` can force onboarding to reset each visit by clearing localStorage.

### Vertical Translation Slider

When the calendar card height is at least 10% smaller than the background and the card is selected, a minimal slider appears to translate the card vertically:
- Fixed position, centered in the viewport
- Offset 12px to the right of the card edge
- Max height: 234px
- Changes redistribute top/bottom insets while preserving card height

### Reset Button

A floating "Reset to fill canvas" button appears when `calendarCardInsets` has non-zero values:
- Position: Top-right corner of preview panel
- Action: Resets insets to `{ top: 0, bottom: 0, left: 0, right: 0 }`

---

## Background Gallery System

### Auto-Discovery with Vite

**File:** `assets/backgrounds/index.ts`

Uses Vite's `import.meta.glob` for automatic image discovery:

```typescript
// Full resolution images
const landscapeFull = import.meta.glob<string>(
  './landscape/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

// Thumbnails at 720px (longer side) for gallery UI
const landscapeThumbs = import.meta.glob<string>(
  './landscape/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default', query: '?w=720' }
);
```

### Thumbnail Generation

Uses `vite-imagetools` plugin for automatic thumbnail generation at build time:

**Configuration:** `vite.config.ts`
```typescript
import { imagetools } from 'vite-imagetools';
plugins: [react(), tailwindcss(), imagetools()]
```

Thumbnail sizing:
- **Landscape:** `?w=720` (width is longer side)
- **Portrait:** `?h=720` (height is longer side)

### BackgroundOption Interface

```typescript
interface BackgroundOption {
  id: string;          // Unique identifier (e.g., 'l001' for landscape)
  url: string;         // Full resolution URL
  thumbnailUrl: string; // 720px thumbnail URL
  name: string;        // Display name
}
```

### Exported Collections

- `LANDSCAPE_BACKGROUNDS`: Array of landscape background options
- `PORTRAIT_BACKGROUNDS`: Array of portrait background options
- `BACKGROUND_IMAGE_MAP`: Record mapping IDs to full URLs for CalendarCanvas lookups

### Adding New Backgrounds

Simply drop image files into:
- `assets/backgrounds/landscape/` for landscape images
- `assets/backgrounds/portrait/` for portrait images

No code changes required - images are auto-discovered on next build.

---

## Background Gallery Popup

**File:** `components/ExportStep.tsx`

### Features

1. **Grid Layout:**
   - Landscape: 2-column grid
   - Portrait: 3-column grid

2. **Selection Workflow:**
   - Click thumbnail to select (highlighted border)
   - Preview updates with selected background
   - Click "Apply" to commit selection to actual canvas

3. **Preview Panel:**
   - Width: 450px
   - Shows CalendarCanvas with `hideTextContent={true}`
   - Dynamic aspect ratio based on selection (landscape/portrait)
   - Uses `calendarCardInsets` for card positioning within background

### State Management

```typescript
const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
const [gallerySelectedBg, setGallerySelectedBg] = useState<string | null>(null);
```

- `gallerySelectedBg` holds temporary selection
- On "Apply", selection is committed to `template.backgroundImage`
- On close, selection is cleared without applying

---

## File Structure

```
assets/
  backgrounds/
    index.ts           # Auto-discovery and exports
    landscape/         # Drop landscape images here
    portrait/          # Drop portrait images here

components/
  CalendarCanvas.tsx   # Main canvas component with selection/resize support
  ExportStep.tsx       # Export UI with gallery popup and resize handlers

themes/
  index.ts             # Theme definitions and getTheme()

types.ts               # TypeScript interfaces (TemplateConfig, CalendarEvent,
                       # SelectableExportComponent, ResizeEdge, etc.)
```

---

## Key Dependencies

- `vite-imagetools`: Automatic thumbnail generation
- `react`: UI framework
- `tailwindcss`: Styling
- `lucide-react`: Icons
