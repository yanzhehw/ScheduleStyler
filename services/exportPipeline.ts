import * as htmlToImage from 'html-to-image';
import acrylicTextureUrl from '../assets/Texture_Acrylic.png';

type BackgroundType = 'none' | 'color' | 'image';

type BackgroundOptions = {
  backgroundType?: BackgroundType;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundBlur?: number;
  backgroundOverlay?: number;
};

const isExportDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window as { __EXPORT_DEBUG__?: boolean }).__EXPORT_DEBUG__ === true;
};

const exportDebugLog = (...args: unknown[]) => {
  if (!isExportDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log('[EXPORT DEBUG]', ...args);
};

const exportNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Draw image into a canvas rect using CSS background-size:cover / background-position:center semantics
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number,
  w: number, h: number
) => {
  const ir = img.naturalWidth / img.naturalHeight;
  const tr = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > tr) {
    sw = img.naturalHeight * tr;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / tr;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

// Draw background directly onto the canvas using Canvas API, bypassing html-to-image's
// SVG foreignObject (which fails to render background-image/background-color on mobile Safari).
const drawBackgroundDirect = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: BackgroundOptions,
  pixelRatio: number
): Promise<ImageBitmap | null> => {
  if (bg.backgroundType === 'color' && bg.backgroundColor) {
    ctx.fillStyle = bg.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    return await createImageBitmap(ctx.canvas);
  }

  if (bg.backgroundType === 'image' && bg.backgroundImageUrl) {
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // silently fail; base layer fallback will apply
      img.src = bg.backgroundImageUrl!;
    });
    if (img.naturalWidth === 0) return null;

    const blur = bg.backgroundBlur ?? 0;
    if (blur > 0) {
      // Scale blur and padding to canvas pixel space (width/height are already CSS * pixelRatio).
      // Canvas filter operates in canvas-pixel units, so CSS blur must be scaled up.
      const scaledBlur = blur * pixelRatio;
      const pad = scaledBlur;
      const tmp = document.createElement('canvas');
      tmp.width = width + 2 * pad;
      tmp.height = height + 2 * pad;
      const tmpCtx = tmp.getContext('2d')!;
      tmpCtx.filter = `blur(${scaledBlur}px)`;
      drawImageCover(tmpCtx, img, 0, 0, tmp.width, tmp.height);
      tmpCtx.filter = 'none';
      if ((bg.backgroundOverlay ?? 0) > 0) {
        tmpCtx.fillStyle = `rgba(0,0,0,${bg.backgroundOverlay! / 100})`;
        tmpCtx.fillRect(0, 0, tmp.width, tmp.height);
      }
      ctx.drawImage(tmp, pad, pad, width, height, 0, 0, width, height);
    } else {
      drawImageCover(ctx, img, 0, 0, width, height);
      if ((bg.backgroundOverlay ?? 0) > 0) {
        ctx.fillStyle = `rgba(0,0,0,${bg.backgroundOverlay! / 100})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
    return await createImageBitmap(ctx.canvas);
  }

  return null;
};

type BlurRadius = {
  tl: number;
  tr: number;
  br: number;
  bl: number;
};

type BlurRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  blurPx: number;
  radius: BlurRadius;
  overlayColor?: string | null;
  hasGrain?: boolean;
};

type EventBlockShadow = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: BlurRadius;
  boxShadow: string;
};

type EventBlockBorder = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: BlurRadius;
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
};

const DEFAULT_PIXEL_RATIO = 3;

// Font families used in the app that need to be embedded
const GOOGLE_FONTS = [
  'Inter',
  'Poppins',
  'Nunito',
  'Outfit',
  'DM+Sans',
  'Lora',
  'Playfair+Display',
  'DM+Serif+Display',
  'Montserrat',
  'EB+Garamond',
  'JetBrains+Mono',
  'Space+Mono',
  'Fira+Code',
];

let fontCSSCache: string | null = null;
let stagingRoot: HTMLDivElement | null = null;
let grainTexturePromise: Promise<HTMLImageElement | null> | null = null;

const ensureStagingRoot = () => {
  if (stagingRoot) return stagingRoot;
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.zIndex = '-1';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  stagingRoot = root;
  return root;
};

const loadGrainTexture = (): Promise<HTMLImageElement | null> => {
  if (grainTexturePromise) return grainTexturePromise;
  grainTexturePromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = acrylicTextureUrl;
  });
  return grainTexturePromise;
};

// Fetch and embed Google Fonts CSS
const fetchFontEmbedCSS = async (): Promise<string> => {
  try {
    const fontFamilies = GOOGLE_FONTS.join('&family=');
    const url = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@400;500;600;700;800&display=swap`;

    const response = await fetch(url);
    if (!response.ok) return '';

    let css = await response.text();

    // Extract font URLs and convert to base64 for embedding
    const fontUrls = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g) || [];

    for (const urlMatch of fontUrls) {
      const fontUrl = urlMatch.slice(4, -1); // Remove 'url(' and ')'
      try {
        const fontResponse = await fetch(fontUrl);
        if (fontResponse.ok) {
          const fontBlob = await fontResponse.blob();
          const fontBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(fontBlob);
          });
          css = css.replace(fontUrl, fontBase64);
        }
      } catch {
        // If font fetch fails, keep original URL
      }
    }

    return css;
  } catch {
    return '';
  }
};

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return;
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
          resolve();
        };
        img.onload = cleanup;
        img.onerror = cleanup;
      });
    })
  );
};

// Pre-inline CSS background-image URLs as data URLs.
// html-to-image fetches these internally, but on mobile Safari the fetch
// often fails silently (SVG foreignObject can't load external resources).
// By converting to data URLs first, we guarantee the image is present
// regardless of browser or CORS restrictions.
// Returns true when the browser needs pre-inlined background images.
// html-to-image handles images natively on desktop Chrome/Firefox, so this
// is only necessary for mobile Safari (SVG foreignObject can't load external
// resources) and WebKit-based browsers.
const needsBackgroundImageInlining = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // Mobile devices always need it
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  // Desktop Safari needs it
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return true;
  return false;
};

const inlineCSSBackgroundImages = async (root: HTMLElement): Promise<void> => {
  // Skip on desktop Chrome/Firefox — html-to-image handles images natively there.
  if (!needsBackgroundImageInlining()) return;

  const elements = Array.from(root.querySelectorAll<HTMLElement>('*'));
  elements.push(root);

  // Deduplicate: fetch each unique URL only once, then apply to all matching elements.
  const urlToDataUrl = new Map<string, Promise<string | null>>();

  const fetchDataUrl = (url: string): Promise<string | null> => {
    if (urlToDataUrl.has(url)) return urlToDataUrl.get(url)!;
    const p = (async () => {
      try {
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    })();
    urlToDataUrl.set(url, p);
    return p;
  };

  await Promise.all(
    elements.map(async (el) => {
      const bgImage = el.style.backgroundImage;
      if (!bgImage || bgImage === 'none') return;

      const match = /url\(["']?([^"')]+)["']?\)/.exec(bgImage);
      if (!match) return;
      const url = match[1];
      if (url.startsWith('data:')) return; // already inlined

      const dataUrl = await fetchDataUrl(url);
      if (dataUrl) {
        el.style.backgroundImage = `url(${dataUrl})`;
      }
    })
  );
};

// Debug-only: log font properties from the clone without modifying any styles.
const logFontDiagnostics = (root: HTMLElement) => {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
  const textSamples: Array<{
    tag: string;
    text: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    letterSpacing: string;
    lineHeight: string;
    webkitFontSmoothing: string;
  }> = [];

  nodes.forEach((el) => {
    if (textSamples.length >= 10) return;
    if (!el.textContent?.trim() || el.children.length > 0) return;
    const style = window.getComputedStyle(el);
    textSamples.push({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent?.trim() || '').slice(0, 30),
      fontFamily: style.fontFamily.slice(0, 40),
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      webkitFontSmoothing: (style as unknown as Record<string, string>).webkitFontSmoothing || '',
    });
  });

  exportDebugLog('font diagnostics (read-only, no overrides applied)', {
    totalNodes: nodes.length,
    samples: textSamples,
  });
};

const dataUrlToImageBitmap = async (dataUrl: string): Promise<ImageBitmap> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

const parseBlurPx = (filterValue: string): number => {
  if (!filterValue || filterValue === 'none') return 0;
  const match = /blur\(([\d.]+)px\)/.exec(filterValue);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : 0;
};

const parseRadius = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitBoxShadow = (value: string): string[] => {
  return value.split(/,(?![^(]*\))/).map((part) => part.trim()).filter(Boolean);
};

const parseBoxShadow = (value: string): { offsetX: number; offsetY: number; blur: number; spread: number; color: string } | null => {
  if (!value || value === 'none') return null;
  const first = splitBoxShadow(value)[0];
  if (!first || first.includes('inset')) return null;

  const colorMatch = first.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8})/);
  const color = colorMatch ? colorMatch[1] : 'rgba(0,0,0,0.2)';
  const lengthPart = colorMatch ? first.replace(colorMatch[1], '').trim() : first.trim();
  const parts = lengthPart.split(/\s+/).filter(Boolean);
  const nums = parts.map((part) => parseFloat(part)).filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const [offsetX, offsetY, blur = 0, spread = 0] = nums;
  return { offsetX, offsetY, blur, spread, color };
};

const parseAlphaFromColor = (color: string): number | null => {
  if (!color) return null;
  if (color === 'transparent') return 0;
  const match = /rgba?\(([^)]+)\)/.exec(color);
  if (!match) return null;
  const parts = match[1]
    .trim()
    .split(/[\s,\/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3) return null;
  if (parts.length >= 4) {
    const alpha = parts[3];
    return Number.isFinite(alpha) ? alpha : null;
  }
  return 1;
};

const isTransparentColor = (color: string): boolean => {
  const alpha = parseAlphaFromColor(color);
  if (alpha === null) return false;
  return alpha <= 0;
};

const getOverlayTargetInfo = (el: HTMLElement, root: HTMLElement): {
  target: HTMLElement | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
} => {
  let current: HTMLElement | null = el;
  while (current) {
    const style = window.getComputedStyle(current);
    const bgImage = style.backgroundImage && style.backgroundImage !== 'none' ? style.backgroundImage : null;
    const bgColor = style.backgroundColor && !isTransparentColor(style.backgroundColor) ? style.backgroundColor : null;
    if (bgImage || bgColor) {
      return {
        target: current,
        backgroundColor: bgColor,
        backgroundImage: bgImage,
      };
    }
    if (current === root) break;
    current = current.parentElement;
  }
  return { target: null, backgroundColor: null, backgroundImage: null };
};

const collectBlurRegions = (root: HTMLElement): BlurRegion[] => {
  const rootRect = root.getBoundingClientRect();
  const regions: BlurRegion[] = [];
  const skipComponents = new Set(['CalendarCard', 'BackgroundContainer']);
  const debugEnabled = isExportDebugEnabled();
  let misalignedCount = 0;
  const misalignedSamples: Array<{
    blurRect: { x: number; y: number; w: number; h: number };
    eventRect: { x: number; y: number; w: number; h: number };
  }> = [];

  const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
  const grainEventBlocks = new Set<HTMLElement>();

  nodes.forEach((el) => {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    if (!bgImage || bgImage === 'none') return;
    if (bgImage.includes('Texture_Acrylic') || bgImage.includes(acrylicTextureUrl)) {
      const eventBlock = el.closest<HTMLElement>('[data-component="EventBlock"]');
      if (eventBlock) {
        grainEventBlocks.add(eventBlock);
      }
    }
  });

  nodes.forEach((el) => {
    const component = el.dataset.component;
    if (component && skipComponents.has(component)) return;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    if (parseFloat(style.opacity) === 0) return;

    const backdrop = style.backdropFilter || (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter || '';
    const blurPx = parseBlurPx(backdrop);
    if (blurPx <= 0) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const left = rect.left - rootRect.left;
    const top = rect.top - rootRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;

    const clampedLeft = Math.max(0, left);
    const clampedTop = Math.max(0, top);
    const clampedRight = Math.min(rootRect.width, right);
    const clampedBottom = Math.min(rootRect.height, bottom);
    const width = clampedRight - clampedLeft;
    const height = clampedBottom - clampedTop;

    if (width <= 0 || height <= 0) return;

    const overlayInfo = getOverlayTargetInfo(el, root);
    const overlayColor = overlayInfo.backgroundImage
      ? null
      : overlayInfo.backgroundColor;

    const eventBlock = el.closest<HTMLElement>('[data-component="EventBlock"]');
    const hasGrain = eventBlock ? grainEventBlocks.has(eventBlock) : false;

    if (debugEnabled) {
      if (eventBlock) {
        const eventRect = eventBlock.getBoundingClientRect();
        const dx = Math.abs(rect.left - eventRect.left);
        const dy = Math.abs(rect.top - eventRect.top);
        const dw = Math.abs(rect.width - eventRect.width);
        const dh = Math.abs(rect.height - eventRect.height);
        if (dx > 0.5 || dy > 0.5 || dw > 0.5 || dh > 0.5) {
          misalignedCount += 1;
          if (misalignedSamples.length < 3) {
            misalignedSamples.push({
              blurRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
              eventRect: { x: eventRect.left, y: eventRect.top, w: eventRect.width, h: eventRect.height },
            });
          }
        }
      }
    }

    regions.push({
      x: clampedLeft,
      y: clampedTop,
      width,
      height,
      blurPx,
      radius: {
        tl: parseRadius(style.borderTopLeftRadius),
        tr: parseRadius(style.borderTopRightRadius),
        br: parseRadius(style.borderBottomRightRadius),
        bl: parseRadius(style.borderBottomLeftRadius),
      },
      overlayColor,
      hasGrain,
    });
  });
  if (debugEnabled && grainEventBlocks.size > 0) {
    exportDebugLog('collectBlurRegions: grain event blocks', grainEventBlocks.size);
  }
  return regions;
};

const collectEventBlockShadows = (root: HTMLElement): EventBlockShadow[] => {
  const rootRect = root.getBoundingClientRect();
  const eventBlocks = Array.from(root.querySelectorAll<HTMLElement>('[data-component="EventBlock"]'));
  const shadows: EventBlockShadow[] = [];
  const debugEnabled = isExportDebugEnabled();
  const samples: Array<{ boxShadow: string; rect: { x: number; y: number; w: number; h: number } }> = [];

  eventBlocks.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (!style.boxShadow || style.boxShadow === 'none') return;
    const rect = el.getBoundingClientRect();
    shadows.push({
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
      radius: {
        tl: parseRadius(style.borderTopLeftRadius),
        tr: parseRadius(style.borderTopRightRadius),
        br: parseRadius(style.borderBottomRightRadius),
        bl: parseRadius(style.borderBottomLeftRadius),
      },
      boxShadow: style.boxShadow,
    });

    if (debugEnabled && samples.length < 3) {
      samples.push({
        boxShadow: style.boxShadow,
        rect: { x: rect.left - rootRect.left, y: rect.top - rootRect.top, w: rect.width, h: rect.height },
      });
    }
  });

  if (debugEnabled) {
    exportDebugLog('event block shadows captured', {
      count: shadows.length,
      samples,
    });
  }

  return shadows;
};

const collectEventBlockBorders = (root: HTMLElement): EventBlockBorder[] => {
  const rootRect = root.getBoundingClientRect();
  const eventBlocks = Array.from(root.querySelectorAll<HTMLElement>('[data-component="EventBlock"]'));
  const borders: EventBlockBorder[] = [];
  const debugEnabled = isExportDebugEnabled();
  const allBorderDetails: Array<{
    index: number;
    borderColor: string;
    borderWidth: number;
    borderStyle: string;
    radius: { tl: number; tr: number; br: number; bl: number };
    rect: { x: number; y: number; w: number; h: number };
    allSidesMatch: boolean;
  }> = [];

  eventBlocks.forEach((el, idx) => {
    const style = window.getComputedStyle(el);
    const borderWidth = parseFloat(style.borderTopWidth);
    const borderStyle = style.borderTopStyle;
    const borderColor = style.borderTopColor;
    if (!borderWidth || borderWidth <= 0) return;
    if (!borderStyle || borderStyle === 'none') return;
    if (isTransparentColor(borderColor)) return;

    const rect = el.getBoundingClientRect();
    const radius = {
      tl: parseRadius(style.borderTopLeftRadius),
      tr: parseRadius(style.borderTopRightRadius),
      br: parseRadius(style.borderBottomRightRadius),
      bl: parseRadius(style.borderBottomLeftRadius),
    };
    borders.push({
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
      radius,
      borderWidth,
      borderColor,
      borderStyle,
    });

    if (debugEnabled) {
      // Check if all 4 sides have the same border (CSS can have different per-side)
      const allSidesMatch =
        style.borderTopWidth === style.borderRightWidth &&
        style.borderRightWidth === style.borderBottomWidth &&
        style.borderBottomWidth === style.borderLeftWidth &&
        style.borderTopColor === style.borderRightColor &&
        style.borderRightColor === style.borderBottomColor &&
        style.borderBottomColor === style.borderLeftColor &&
        style.borderTopStyle === style.borderRightStyle &&
        style.borderRightStyle === style.borderBottomStyle &&
        style.borderBottomStyle === style.borderLeftStyle;
      allBorderDetails.push({
        index: idx,
        borderColor,
        borderWidth,
        borderStyle,
        radius,
        rect: { x: rect.left - rootRect.left, y: rect.top - rootRect.top, w: rect.width, h: rect.height },
        allSidesMatch,
      });
    }
  });

  if (debugEnabled) {
    exportDebugLog('border diagnostics', {
      totalEventBlocks: eventBlocks.length,
      bordersCollected: borders.length,
      skipped: eventBlocks.length - borders.length,
      details: allBorderDetails,
    });
  }

  return borders;
};

const applyBaseLayerVisibility = (clone: HTMLElement) => {
  const hideSelectors = [
    '[data-component="DayHeader"]',
    '[data-component="TimeColumn"]',
    '[data-component="EventBlock"]',
    '[data-component="EmptySlot"]',
    '[data-component="CalendarFooter"]',
  ];

  hideSelectors.forEach((selector) => {
    clone.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.visibility = 'hidden';
    });
  });

  const debugEnabled = isExportDebugEnabled();
  const eventBlocks = Array.from(clone.querySelectorAll<HTMLElement>('[data-component="EventBlock"]'));
  let shadowSourceCount = 0;
  const shadowSamples: Array<{ boxShadow: string; filter: string; rect: { x: number; y: number; w: number; h: number } }> = [];

  eventBlocks.forEach((el) => {
    if (debugEnabled) {
      const style = window.getComputedStyle(el);
      const hasShadow = style.boxShadow && style.boxShadow !== 'none';
      const hasFilter = style.filter && style.filter !== 'none';
      if (hasShadow || hasFilter) {
        shadowSourceCount += 1;
        if (shadowSamples.length < 3) {
          const rect = el.getBoundingClientRect();
          shadowSamples.push({
            boxShadow: style.boxShadow,
            filter: style.filter,
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          });
        }
      }
    }

    // Remove event blocks entirely from the base layer to avoid shadow artifacts.
    el.style.display = 'none';
    el.style.boxShadow = 'none';
    el.style.filter = 'none';
  });

  if (debugEnabled) {
    exportDebugLog('base layer event blocks hidden', eventBlocks.length);
    if (shadowSourceCount > 0) {
      exportDebugLog('base layer event block shadow sources', {
        count: shadowSourceCount,
        samples: shadowSamples,
      });
    }
  }
};

const applyForegroundLayerVisibility = (clone: HTMLElement) => {
  const hideSelectors = [
    '[data-component="BackgroundLayer"]',
    '[data-component="GridLines"]',
    '[data-component="EmptySlot"]',
  ];

  hideSelectors.forEach((selector) => {
    clone.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.visibility = 'hidden';
    });
  });

  clone.querySelectorAll<HTMLElement>('[data-component="DayColumn"]').forEach((el) => {
    el.style.borderColor = 'transparent';
  });

  clone
    .querySelectorAll<HTMLElement>('[data-component="CalendarCard"], [data-component="BackgroundContainer"]')
    .forEach((el) => {
      el.style.background = 'transparent';
      el.style.backgroundColor = 'transparent';
      el.style.boxShadow = 'none';
      el.style.borderColor = 'transparent';
    });

  const overlayTargets = new Set<HTMLElement>();
  const debugEnabled = isExportDebugEnabled();

  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = window.getComputedStyle(el);
    const hasBackdrop =
      (style.backdropFilter && style.backdropFilter !== 'none') ||
      ((style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter && (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter !== 'none');
    if (!hasBackdrop) return;
    el.style.backdropFilter = 'none';
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = 'none';

    const overlayInfo = getOverlayTargetInfo(el, clone);
    // Exclude EventBlocks: their background color must be preserved in the foreground
    // capture so that borders have proper visual contrast. The blur canvas step already
    // reconstructs the frosted-glass region beneath each event block, so making the
    // EventBlock itself transparent here is incorrect and causes borders to appear
    // washed out / less opaque in the exported image.
    if (
      overlayInfo.target &&
      !overlayInfo.backgroundImage &&
      !overlayInfo.target.matches('[data-component="EventBlock"]')
    ) {
      overlayTargets.add(overlayInfo.target);
    }

  });

  overlayTargets.forEach((el) => {
    el.style.background = 'transparent';
    el.style.backgroundColor = 'transparent';
    el.style.backgroundImage = 'none';
  });

  exportDebugLog('applyForegroundLayerVisibility: overlayTargets', overlayTargets.size);

  // Remove event block shadows/filters for export to avoid misaligned drop shadows on iOS.
  const eventBlocks = Array.from(clone.querySelectorAll<HTMLElement>('[data-component="EventBlock"]'));
  let shadowSourceCount = 0;
  const shadowSamples: Array<{ boxShadow: string; filter: string; rect: { x: number; y: number; w: number; h: number } }> = [];
  const stripShadow = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    const hasShadow = style.boxShadow && style.boxShadow !== 'none';
    const hasFilter = style.filter && style.filter !== 'none';
    if (debugEnabled && (hasShadow || hasFilter)) {
      shadowSourceCount += 1;
      if (shadowSamples.length < 3) {
        const rect = el.getBoundingClientRect();
        shadowSamples.push({
          boxShadow: style.boxShadow,
          filter: style.filter,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        });
      }
    }
    if (hasShadow) el.style.boxShadow = 'none';
    if (hasFilter) el.style.filter = 'none';
  };

  eventBlocks.forEach((el) => {
    stripShadow(el);
    // NOTE: Borders are intentionally kept in the foreground capture (not stripped)
    // so that html-to-image renders them identically to the preview. Previously they
    // were stripped and redrawn on canvas via drawEventBlockBorders(), but Canvas
    // ctx.stroke() has different antialiasing/rendering than CSS borders, causing
    // visual mismatch on mobile. See docs/export_pipeline_bug3.md.
    el.querySelectorAll<HTMLElement>('*').forEach((child) => {
      stripShadow(child);
    });
  });

  let grainRemoved = 0;
  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    if (!bgImage || bgImage === 'none') return;
    if (bgImage.includes('Texture_Acrylic') || bgImage.includes(acrylicTextureUrl)) {
      grainRemoved += 1;
      el.style.backgroundImage = 'none';
    }
  });

  if (debugEnabled) {
    exportDebugLog('foreground event blocks', eventBlocks.length);
    if (shadowSourceCount > 0) {
      exportDebugLog('foreground shadow sources stripped', {
        count: shadowSourceCount,
        samples: shadowSamples,
      });
    }
    if (grainRemoved > 0) {
      exportDebugLog('foreground grain overlays removed', grainRemoved);
    }
  }
};

const captureLayer = async (
  node: HTMLElement,
  options: {
    pixelRatio: number;
    fontEmbedCSS: string;
    prepare: (clone: HTMLElement) => void;
    beforePrepare?: (clone: HTMLElement) => void;
  }
): Promise<ImageBitmap> => {
  const tStart = exportNow();
  const staging = ensureStagingRoot();
  const clone = node.cloneNode(true) as HTMLElement;
  staging.appendChild(clone);

  // Run before prepare — used to collect blur regions from the clone while it still
  // has the same layout/backdrop-filter state as the original. This guarantees positions
  // match the captured image (avoids mobile layout mismatches with the live DOM).
  if (options.beforePrepare) {
    options.beforePrepare(clone);
  }

  options.prepare(clone);
  // NOTE: applyFontWeightOverrides is no longer called here. html-to-image already
  // inlines all computed styles (including fontWeight) during its own cloning process.
  // Our previous manual overrides (fontWeight baking, fontVariationSettings, fontSynthesis,
  // text-shadow) were interfering with html-to-image's native style inlining and causing
  // the exported text to render differently from the preview. See docs/export_pipeline_bug3.md.
  if (isExportDebugEnabled()) {
    // Still log font diagnostics in debug mode for verification
    logFontDiagnostics(clone);
  }
  await waitForImages(clone);
  await inlineCSSBackgroundImages(clone);

  const dataUrl = await htmlToImage.toPng(clone, {
    quality: 1.0,
    pixelRatio: options.pixelRatio,
    fontEmbedCSS: options.fontEmbedCSS,
    style: {
      transform: 'scale(1)',
    },
    filter: () => true,
  });

  staging.removeChild(clone);
  const bitmap = await dataUrlToImageBitmap(dataUrl);
  exportDebugLog('captureLayer', {
    durationMs: Math.round(exportNow() - tStart),
    bitmap: { w: bitmap.width, h: bitmap.height },
  });
  return bitmap;
};

const addRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: BlurRadius
) => {
  const maxRadiusX = width / 2;
  const maxRadiusY = height / 2;
  const tl = Math.min(radius.tl, maxRadiusX, maxRadiusY);
  const tr = Math.min(radius.tr, maxRadiusX, maxRadiusY);
  const br = Math.min(radius.br, maxRadiusX, maxRadiusY);
  const bl = Math.min(radius.bl, maxRadiusX, maxRadiusY);

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
};

const drawEventBlockShadows = (
  ctx: CanvasRenderingContext2D,
  shadows: EventBlockShadow[],
  scaleX: number,
  scaleY: number,
  blurScale: number
) => {
  if (shadows.length === 0) return;
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = ctx.canvas.width;
  shadowCanvas.height = ctx.canvas.height;
  const shadowCtx = shadowCanvas.getContext('2d');
  if (!shadowCtx) return;

  shadows.forEach((shadow) => {
    const parsed = parseBoxShadow(shadow.boxShadow);
    if (!parsed) return;

    const spread = parsed.spread * blurScale;
    const x = shadow.x * scaleX - spread;
    const y = shadow.y * scaleY - spread;
    const width = shadow.width * scaleX + spread * 2;
    const height = shadow.height * scaleY + spread * 2;
    const radius: BlurRadius = {
      tl: Math.max(0, shadow.radius.tl * blurScale + spread),
      tr: Math.max(0, shadow.radius.tr * blurScale + spread),
      br: Math.max(0, shadow.radius.br * blurScale + spread),
      bl: Math.max(0, shadow.radius.bl * blurScale + spread),
    };

    shadowCtx.save();
    shadowCtx.shadowColor = parsed.color;
    shadowCtx.shadowBlur = parsed.blur * blurScale;
    shadowCtx.shadowOffsetX = parsed.offsetX * scaleX;
    shadowCtx.shadowOffsetY = parsed.offsetY * scaleY;
    shadowCtx.fillStyle = 'rgba(0,0,0,1)';
    addRoundedRectPath(shadowCtx, x, y, width, height, radius);
    shadowCtx.fill();
    shadowCtx.restore();

    // Remove the filled interior so only the shadow remains.
    shadowCtx.save();
    shadowCtx.globalCompositeOperation = 'destination-out';
    shadowCtx.fillStyle = '#000';
    addRoundedRectPath(shadowCtx, x, y, width, height, radius);
    shadowCtx.fill();
    shadowCtx.restore();
  });

  ctx.drawImage(shadowCanvas, 0, 0);
  shadowCanvas.width = 0;
  shadowCanvas.height = 0;
};

const drawEventBlockBorders = (
  ctx: CanvasRenderingContext2D,
  borders: EventBlockBorder[],
  scaleX: number,
  scaleY: number,
  blurScale: number
) => {
  if (borders.length === 0) return;
  const debugEnabled = isExportDebugEnabled();
  const drawParams: Array<{
    index: number;
    cssWidth: number;
    canvasLineWidth: number;
    cssRect: { x: number; y: number; w: number; h: number };
    canvasRect: { x: number; y: number; w: number; h: number };
    cssRadius: BlurRadius;
    canvasRadius: BlurRadius;
    color: string;
  }> = [];

  borders.forEach((border, i) => {
    const lineWidth = border.borderWidth * blurScale;
    if (!Number.isFinite(lineWidth) || lineWidth <= 0) return;
    const x = border.x * scaleX + lineWidth / 2;
    const y = border.y * scaleY + lineWidth / 2;
    const width = border.width * scaleX - lineWidth;
    const height = border.height * scaleY - lineWidth;
    if (width <= 0 || height <= 0) return;

    const radius: BlurRadius = {
      tl: Math.max(0, border.radius.tl * blurScale - lineWidth / 2),
      tr: Math.max(0, border.radius.tr * blurScale - lineWidth / 2),
      br: Math.max(0, border.radius.br * blurScale - lineWidth / 2),
      bl: Math.max(0, border.radius.bl * blurScale - lineWidth / 2),
    };

    if (debugEnabled) {
      drawParams.push({
        index: i,
        cssWidth: border.borderWidth,
        canvasLineWidth: lineWidth,
        cssRect: { x: border.x, y: border.y, w: border.width, h: border.height },
        canvasRect: { x, y, w: width, h: height },
        cssRadius: border.radius,
        canvasRadius: radius,
        color: border.borderColor,
      });
    }

    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = border.borderColor;
    ctx.lineJoin = 'round';
    addRoundedRectPath(ctx, x, y, width, height, radius);
    ctx.stroke();
    ctx.restore();
  });

  if (debugEnabled) {
    exportDebugLog('border draw diagnostics', {
      totalDrawn: drawParams.length,
      scaleX,
      scaleY,
      blurScale,
      draws: drawParams,
    });
  }
};

const drawGrainOverlay = (
  ctx: CanvasRenderingContext2D,
  regions: BlurRegion[],
  scaleX: number,
  scaleY: number,
  blurScale: number,
  pattern: CanvasPattern
) => {
  regions.forEach((region) => {
    if (!region.hasGrain) return;
    const x = region.x * scaleX;
    const y = region.y * scaleY;
    const width = region.width * scaleX;
    const height = region.height * scaleY;
    const radius: BlurRadius = {
      tl: region.radius.tl * blurScale,
      tr: region.radius.tr * blurScale,
      br: region.radius.br * blurScale,
      bl: region.radius.bl * blurScale,
    };

    ctx.save();
    addRoundedRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.globalAlpha = 0.1;
    ctx.translate(x, y);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  });
};


const boxBlurHorizontal = (
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) => {
  const windowSize = radius * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;
    const rowOffset = y * width;

    for (let i = -radius; i <= radius; i += 1) {
      const x = Math.min(width - 1, Math.max(0, i));
      const idx = (rowOffset + x) * 4;
      rSum += src[idx];
      gSum += src[idx + 1];
      bSum += src[idx + 2];
      aSum += src[idx + 3];
    }

    for (let x = 0; x < width; x += 1) {
      const dstIdx = (rowOffset + x) * 4;
      dst[dstIdx] = Math.round(rSum / windowSize);
      dst[dstIdx + 1] = Math.round(gSum / windowSize);
      dst[dstIdx + 2] = Math.round(bSum / windowSize);
      dst[dstIdx + 3] = Math.round(aSum / windowSize);

      const xRemove = Math.min(width - 1, Math.max(0, x - radius));
      const xAdd = Math.min(width - 1, Math.max(0, x + radius + 1));
      const idxRemove = (rowOffset + xRemove) * 4;
      const idxAdd = (rowOffset + xAdd) * 4;

      rSum += src[idxAdd] - src[idxRemove];
      gSum += src[idxAdd + 1] - src[idxRemove + 1];
      bSum += src[idxAdd + 2] - src[idxRemove + 2];
      aSum += src[idxAdd + 3] - src[idxRemove + 3];
    }
  }
};

const boxBlurVertical = (
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) => {
  const windowSize = radius * 2 + 1;
  for (let x = 0; x < width; x += 1) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    for (let i = -radius; i <= radius; i += 1) {
      const y = Math.min(height - 1, Math.max(0, i));
      const idx = (y * width + x) * 4;
      rSum += src[idx];
      gSum += src[idx + 1];
      bSum += src[idx + 2];
      aSum += src[idx + 3];
    }

    for (let y = 0; y < height; y += 1) {
      const dstIdx = (y * width + x) * 4;
      dst[dstIdx] = Math.round(rSum / windowSize);
      dst[dstIdx + 1] = Math.round(gSum / windowSize);
      dst[dstIdx + 2] = Math.round(bSum / windowSize);
      dst[dstIdx + 3] = Math.round(aSum / windowSize);

      const yRemove = Math.min(height - 1, Math.max(0, y - radius));
      const yAdd = Math.min(height - 1, Math.max(0, y + radius + 1));
      const idxRemove = (yRemove * width + x) * 4;
      const idxAdd = (yAdd * width + x) * 4;

      rSum += src[idxAdd] - src[idxRemove];
      gSum += src[idxAdd + 1] - src[idxRemove + 1];
      bSum += src[idxAdd + 2] - src[idxRemove + 2];
      aSum += src[idxAdd + 3] - src[idxRemove + 3];
    }
  }
};

const boxBlurImageData = (
  imageData: ImageData,
  width: number,
  height: number,
  radius: number,
  passes: number
) => {
  if (radius <= 0) return;
  const src = imageData.data;
  const tmp = new Uint8ClampedArray(src.length);
  for (let i = 0; i < passes; i += 1) {
    boxBlurHorizontal(src, tmp, width, height, radius);
    boxBlurVertical(tmp, src, width, height, radius);
  }
};

const getBlurredCanvas = (
  baseImage: CanvasImageSource,
  width: number,
  height: number,
  blurPx: number
): HTMLCanvasElement => {
  const tStart = exportNow();
  // Prefer native canvas filter when available; manual blur avoids padding to prevent scaling artifacts.
  const filterSupportCtx = document.createElement('canvas').getContext('2d');
  const supportsFilter = Boolean(filterSupportCtx && 'filter' in filterSupportCtx);

  if (!supportsFilter) {
    const manual = document.createElement('canvas');
    manual.width = width;
    manual.height = height;
    const manualCtx = manual.getContext('2d');
    if (!manualCtx) return manual;
    manualCtx.drawImage(baseImage, 0, 0, width, height);
    const radius = Math.max(1, Math.round(blurPx));
    const passes = 3;
    try {
      const imageData = manualCtx.getImageData(0, 0, width, height);
      boxBlurImageData(imageData, width, height, radius, passes);
      manualCtx.putImageData(imageData, 0, 0);
    } catch (err) {
    }
    return manual;
  }

  // Use padded intermediate canvas to prevent edge darkening from native blur.
  const pad = Math.ceil(blurPx);
  const pw = width + pad * 2;
  const ph = height + pad * 2;

  const padded = document.createElement('canvas');
  padded.width = pw;
  padded.height = ph;
  const padCtx = padded.getContext('2d');
  if (!padCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(baseImage, 0, 0, width, height);
    return canvas;
  }

  // Fill padding area with stretched source content (prevents transparent edges)
  padCtx.drawImage(baseImage, 0, 0, pw, ph);
  // Overwrite center with correctly-sized source
  padCtx.drawImage(baseImage, 0, 0, width, height, pad, pad, width, height);

  const blurred = document.createElement('canvas');
  blurred.width = pw;
  blurred.height = ph;
  const blurCtx = blurred.getContext('2d')!;
  blurCtx.filter = `blur(${blurPx}px)`;
  blurCtx.drawImage(padded, 0, 0);
  blurCtx.filter = 'none';

  padded.width = 0;
  padded.height = 0;

  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  const ctx = result.getContext('2d')!;
  ctx.drawImage(blurred, pad, pad, width, height, 0, 0, width, height);

  blurred.width = 0;
  blurred.height = 0;

  return result;
};

export const downloadCalendarExport = async (
  elementId: string,
  fileName: string,
  options: { pixelRatio?: number } & BackgroundOptions = {}
) => {
  const exportStart = exportNow();
  const node = document.getElementById(elementId);
  if (!node) {
    exportDebugLog('Node not found', elementId);
    return;
  }

  exportDebugLog('=== EXPORT START ===', { elementId, fileName });

  const fontsReadyStart = exportNow();
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  const fontsReadyMs = Math.round(exportNow() - fontsReadyStart);

  const fontEmbedStart = exportNow();
  const fontCacheHit = fontCSSCache !== null;
  if (fontCSSCache === null) {
    fontCSSCache = await fetchFontEmbedCSS();
  }
  const fontEmbedMs = Math.round(exportNow() - fontEmbedStart);

  const pixelRatio = options.pixelRatio ?? DEFAULT_PIXEL_RATIO;
  exportDebugLog('pixelRatio', pixelRatio);

  // Collect blur regions from the clone in the staging root (not the live DOM).
  let blurRegions: BlurRegion[] = [];
  let eventBlockShadows: EventBlockShadow[] = [];
  let eventBlockBorders: EventBlockBorder[] = [];
  let cloneRootWidth = 0;
  let cloneRootHeight = 0;

  const baseCaptureStart = exportNow();
  const baseImage = await captureLayer(node, {
    pixelRatio,
    fontEmbedCSS: fontCSSCache || '',
    prepare: applyBaseLayerVisibility,
    beforePrepare: (clone: HTMLElement) => {
      blurRegions = collectBlurRegions(clone);
      const cloneRect = clone.getBoundingClientRect();
      cloneRootWidth = cloneRect.width;
      cloneRootHeight = cloneRect.height;
      exportDebugLog('clone rect', { w: cloneRootWidth, h: cloneRootHeight });
    },
  });
  const baseCaptureMs = Math.round(exportNow() - baseCaptureStart);

  const foregroundCaptureStart = exportNow();
  const foregroundImage = await captureLayer(node, {
    pixelRatio,
    fontEmbedCSS: fontCSSCache || '',
    prepare: (clone: HTMLElement) => {
      eventBlockShadows = collectEventBlockShadows(clone);
      eventBlockBorders = collectEventBlockBorders(clone);
      applyForegroundLayerVisibility(clone);
    },
  });
  const foregroundCaptureMs = Math.round(exportNow() - foregroundCaptureStart);

  const scaleX = baseImage.width / Math.max(1, cloneRootWidth);
  const scaleY = baseImage.height / Math.max(1, cloneRootHeight);
  const blurScale = (scaleX + scaleY) / 2;
  exportDebugLog('scales', {
    devicePixelRatio: window.devicePixelRatio,
    exportPixelRatio: pixelRatio,
    scaleX,
    scaleY,
    blurScale,
    cloneRoot: { w: cloneRootWidth, h: cloneRootHeight },
    baseImage: { w: baseImage.width, h: baseImage.height },
  });

  const canvas = document.createElement('canvas');
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let grainPattern: CanvasPattern | null = null;
  if (blurRegions.some((region) => region.hasGrain)) {
    const grainImage = await loadGrainTexture();
    if (grainImage) {
      const tileSize = Math.max(1, Math.round(128 * blurScale));
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext('2d');
      if (tileCtx) {
        tileCtx.drawImage(grainImage, 0, 0, tileSize, tileSize);
        grainPattern = ctx.createPattern(tileCanvas, 'repeat');
      }
      exportDebugLog('grain pattern ready', { ok: Boolean(grainPattern), tileSize });
    } else {
      exportDebugLog('grain pattern ready', { ok: false });
    }
  }

  // Step 1: draw background directly using Canvas API
  if (options.backgroundType && options.backgroundType !== 'none') {
    await drawBackgroundDirect(ctx, canvas.width, canvas.height, options, pixelRatio);
  }

  // Step 2: draw base layer (contains grid lines, time markers)
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // Step 3: apply blur regions — use composite of background + base layer as blur source.
  let blurMs = 0;
  if (blurRegions.length > 0) {
    const blurStart = exportNow();
    // Snapshot the canvas after background + base layer for use as blur source
    const blurSourceCanvas = document.createElement('canvas');
    blurSourceCanvas.width = canvas.width;
    blurSourceCanvas.height = canvas.height;
    const blurSourceCtx = blurSourceCanvas.getContext('2d')!;
    blurSourceCtx.drawImage(canvas, 0, 0);

    const blurCache = new Map<number, HTMLCanvasElement>();

    blurRegions.forEach((region, i) => {
      const blurPx = region.blurPx * blurScale;
      const cacheKey = Math.round(blurPx * 100) / 100;
      let blurCanvas = blurCache.get(cacheKey);
      if (!blurCanvas) {
        blurCanvas = getBlurredCanvas(blurSourceCanvas, canvas.width, canvas.height, blurPx);
        blurCache.set(cacheKey, blurCanvas);
      }

      const x = region.x * scaleX;
      const y = region.y * scaleY;
      const width = region.width * scaleX;
      const height = region.height * scaleY;
      const radius: BlurRadius = {
        tl: region.radius.tl * blurScale,
        tr: region.radius.tr * blurScale,
        br: region.radius.br * blurScale,
        bl: region.radius.bl * blurScale,
      };

      ctx.save();
      addRoundedRectPath(ctx, x, y, width, height, radius);
      ctx.clip();
      ctx.drawImage(blurCanvas, 0, 0, canvas.width, canvas.height);
      if (region.overlayColor) {
        ctx.fillStyle = region.overlayColor;
        ctx.fillRect(x, y, width, height);
      }
      ctx.restore();
    });

    // Free blur source and cached canvases
    blurSourceCanvas.width = 0;
    blurSourceCanvas.height = 0;
    blurCache.forEach((c) => { c.width = 0; c.height = 0; });
    blurMs = Math.round(exportNow() - blurStart);
  }

  if (eventBlockShadows.length > 0) {
    drawEventBlockShadows(ctx, eventBlockShadows, scaleX, scaleY, blurScale);
  }

  if (grainPattern) {
    drawGrainOverlay(ctx, blurRegions, scaleX, scaleY, blurScale, grainPattern);
  }

  // NOTE: Event block borders are now kept in the foreground html-to-image capture
  // instead of being drawn on canvas. The canvas approach (drawEventBlockBorders) had
  // visual mismatches with CSS border rendering. Border data is still collected above
  // for diagnostic logging. See docs/export_pipeline_bug3.md.
  if (eventBlockBorders.length > 0 && isExportDebugEnabled()) {
    // In debug mode, still draw canvas borders for comparison (will be overwritten by foreground)
    drawEventBlockBorders(ctx, eventBlockBorders, scaleX, scaleY, blurScale);
  }

  // Step 4: draw foreground (content on transparent background, with CSS borders intact)
  ctx.drawImage(foregroundImage, 0, 0, canvas.width, canvas.height);

  const toBlobStart = exportNow();
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  const toBlobMs = Math.round(exportNow() - toBlobStart);
  if (!blob) return;

  exportDebugLog('export timing summary', {
    fontsReadyMs,
    fontEmbedMs,
    fontEmbedCacheHit: fontCacheHit,
    fontEmbedBytes: fontCSSCache ? fontCSSCache.length : 0,
    baseCaptureMs,
    foregroundCaptureMs,
    blurMs,
    toBlobMs,
    totalMs: Math.round(exportNow() - exportStart),
    canvas: { w: canvas.width, h: canvas.height },
    blurRegions: blurRegions.length,
    blobSizeKb: Math.round(blob.size / 1024),
  });

  // On iOS, use Web Share API so users can save to Photos
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

  if (isIOS) {
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      const shareData = { files: [file] };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          // User cancelled share sheet — silently return
          if ((err as Error).name === 'AbortError') return;
          // Other errors fall through to image preview
        }
      }
    }

    // iOS fallback: open image so user can save to Photos
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    if (!opened) {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  // Standard download fallback (desktop and non-iOS)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
