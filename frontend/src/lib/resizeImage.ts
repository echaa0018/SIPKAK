const MAX_SIDE_PX = 800;
const JPEG_QUALITY = 0.7;

/** Scales width × height down so the longest side is at most `max`. Never scales up. */
export function fitWithin(width: number, height: number, max = MAX_SIDE_PX) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not an image we can read.'));
    };
    image.src = url;
  });
}

/**
 * Shrinks a photo in the browser (longest side 800 px, JPEG quality 0.7) and returns it as a
 * "data:image/jpeg;base64,…" URL, usually around 100 KB.
 *
 * SIMULATED: the data URL is sent inside the report's JSON. The real app would upload the file
 * to Supabase Storage and send only its URL.
 */
export async function resizeImage(file: File): Promise<string> {
  const image = await loadImage(file);
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot resize photos.');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
