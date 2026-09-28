import type { FlyerImageSource } from "@/lib/canvas-utils";

export const FLYER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
export const MAX_FLYER_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_PROCESSING_EDGE = 4096;

export function validateFlyerImageFile(file: File) {
  if (!FLYER_IMAGE_TYPES.includes(file.type as (typeof FLYER_IMAGE_TYPES)[number])) {
    throw new Error("Choose a JPG, PNG, WebP, or HEIC photo.");
  }
  if (file.size <= 0 || file.size > MAX_FLYER_IMAGE_BYTES) {
    throw new Error("Choose an image smaller than 15 MB.");
  }
}

export async function decodeFlyerImage(file: File): Promise<FlyerImageSource> {
  validateFlyerImageFile(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(file.type.includes("heic") || file.type.includes("heif")
      ? "This browser cannot decode HEIC. Export the photo as JPG or PNG and try again."
      : "This image could not be decoded. Try a different file.");
  }
  if (Math.max(bitmap.width, bitmap.height) <= MAX_PROCESSING_EDGE) return bitmap;
  const scale = MAX_PROCESSING_EDGE / Math.max(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is not available in this browser.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export function loadFlyerImageUrl(source: string): Promise<FlyerImageSource> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The flyer design could not be loaded."));
    image.src = source;
  });
}
