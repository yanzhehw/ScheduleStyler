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
| `contentVerticalOffset` | `number` | Vertical positioning for lockscreen layouts |

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

### Background Independence

When `backgroundIndependent` is enabled:
- Background and calendar content have separate aspect ratios
- Outer container wraps background at `backgroundAspectRatio`
- Calendar card is centered with optional `contentVerticalOffset`

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
   - Uses `backgroundIndependent` mode for proper preview

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
  CalendarCanvas.tsx   # Main canvas component
  ExportStep.tsx       # Export UI with gallery popup

themes/
  index.ts             # Theme definitions and getTheme()

types.ts               # TypeScript interfaces (TemplateConfig, CalendarEvent, etc.)
```

---

## Key Dependencies

- `vite-imagetools`: Automatic thumbnail generation
- `react`: UI framework
- `tailwindcss`: Styling
- `lucide-react`: Icons
