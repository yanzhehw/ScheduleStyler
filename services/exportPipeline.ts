import * as htmlToImage from 'https://esm.sh/html-to-image@1.11.11';

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
  'Space+Grotesk',
  'Source+Serif+Pro',
];

let fontCSSCache: string | null = null;
let stagingRoot: HTMLDivElement | null = null;

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

// Fetch and embed Google Fonts CSS
const fetchFontEmbedCSS = async (): Promise<string> => {
  try {
    const fontFamilies = GOOGLE_FONTS.join('&family=');
    const url = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@400;500;600;700&display=swap`;

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

const collectBlurRegions = (root: HTMLElement): BlurRegion[] => {
  const rootRect = root.getBoundingClientRect();
  const regions: BlurRegion[] = [];
  const skipComponents = new Set(['CalendarCard', 'BackgroundContainer']);

  const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
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
    });
  });

  return regions;
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
};

const applyForegroundLayerVisibility = (clone: HTMLElement) => {
  const hideSelectors = [
    '[data-component="BackgroundLayer"]',
    '[data-component="GridLines"]',
    '[data-component="EmptySlot"]',
    '[data-component="CalendarFooter"]',
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

  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = window.getComputedStyle(el);
    const hasBackdrop =
      (style.backdropFilter && style.backdropFilter !== 'none') ||
      ((style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter && (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter !== 'none');
    if (!hasBackdrop) return;
    el.style.backdropFilter = 'none';
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = 'none';
  });
};

const captureLayer = async (
  node: HTMLElement,
  options: {
    pixelRatio: number;
    fontEmbedCSS: string;
    prepare: (clone: HTMLElement) => void;
  }
): Promise<ImageBitmap> => {
  const staging = ensureStagingRoot();
  const clone = node.cloneNode(true) as HTMLElement;
  staging.appendChild(clone);
  options.prepare(clone);
  await waitForImages(clone);

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
  return await dataUrlToImageBitmap(dataUrl);
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

const getBlurredCanvas = (
  baseImage: ImageBitmap,
  width: number,
  height: number,
  blurPx: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(baseImage, 0, 0, width, height);
  ctx.filter = 'none';
  return canvas;
};

export const downloadCalendarExport = async (
  elementId: string,
  fileName: string,
  options: { pixelRatio?: number } = {}
) => {
  const node = document.getElementById(elementId);
  if (!node) return;

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  if (fontCSSCache === null) {
    fontCSSCache = await fetchFontEmbedCSS();
  }

  const blurRegions = collectBlurRegions(node);
  const pixelRatio = options.pixelRatio ?? DEFAULT_PIXEL_RATIO;

  const baseImage = await captureLayer(node, {
    pixelRatio,
    fontEmbedCSS: fontCSSCache || '',
    prepare: applyBaseLayerVisibility,
  });

  const foregroundImage = await captureLayer(node, {
    pixelRatio,
    fontEmbedCSS: fontCSSCache || '',
    prepare: applyForegroundLayerVisibility,
  });

  const rootRect = node.getBoundingClientRect();
  const scale = baseImage.width / Math.max(1, rootRect.width);
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  if (blurRegions.length > 0) {
    const blurCache = new Map<number, HTMLCanvasElement>();
    blurRegions.forEach((region) => {
      const blurPx = region.blurPx * scale;
      const cacheKey = Math.round(blurPx * 100) / 100;
      let blurCanvas = blurCache.get(cacheKey);
      if (!blurCanvas) {
        blurCanvas = getBlurredCanvas(baseImage, canvas.width, canvas.height, blurPx);
        blurCache.set(cacheKey, blurCanvas);
      }

      const x = region.x * scale;
      const y = region.y * scale;
      const width = region.width * scale;
      const height = region.height * scale;
      const radius: BlurRadius = {
        tl: region.radius.tl * scale,
        tr: region.radius.tr * scale,
        br: region.radius.br * scale,
        bl: region.radius.bl * scale,
      };

      ctx.save();
      addRoundedRectPath(ctx, x, y, width, height, radius);
      ctx.clip();
      ctx.drawImage(blurCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    });
  }

  ctx.drawImage(foregroundImage, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
