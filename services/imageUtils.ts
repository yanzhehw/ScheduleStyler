import * as htmlToImage from 'https://esm.sh/html-to-image@1.11.11';

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix for Gemini API (it expects raw base64 sometimes, but for inlineData struct we just need the base64 part often,
      // though the SDK is smart. Let's return just the base64 part for SDK compatibility if needed,
      // but strictly the SDK usually takes the base64 string without the prefix for `data`.
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

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

// Cache for font CSS to avoid re-fetching
let fontCSSCache: string | null = null;

export const downloadComponentAsImage = async (elementId: string, fileName: string) => {
  const node = document.getElementById(elementId);
  if (!node) return;

  try {
    // Fetch font CSS if not cached
    if (fontCSSCache === null) {
      fontCSSCache = await fetchFontEmbedCSS();
    }

    const dataUrl = await htmlToImage.toPng(node, {
      quality: 1.0,
      pixelRatio: 3, // High Res
      fontEmbedCSS: fontCSSCache,
      style: {
        // Ensure background is captured correctly
        transform: 'scale(1)',
      },
      // Filter out backdrop-filter styles that can't be rendered
      // and replace them with fallback backgrounds
      filter: (domNode: Element) => {
        // Include all nodes
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('oops, something went wrong!', error);
  }
};
