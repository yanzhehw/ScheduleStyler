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

export const downloadComponentAsImage = async (elementId: string, fileName: string) => {
  const node = document.getElementById(elementId);
  if (!node) return;

  try {
    const dataUrl = await htmlToImage.toPng(node, { 
      quality: 1.0, 
      pixelRatio: 3, // High Res
      style: {
        // Ensure background is captured correctly
        transform: 'scale(1)',
      }
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('oops, something went wrong!', error);
  }
};
