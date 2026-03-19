import { logger } from '../config/logger.js';

/**
 * Platform-specific image dimensions for auto-cropping/resizing.
 */
export const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number; label: string }[]> = {
  INSTAGRAM: [
    { width: 1080, height: 1080, label: 'Feed Square' },
    { width: 1080, height: 1350, label: 'Feed Portrait' },
    { width: 1080, height: 566, label: 'Feed Landscape' },
    { width: 1080, height: 1920, label: 'Story/Reel' },
  ],
  TIKTOK: [
    { width: 1080, height: 1920, label: 'Video' },
  ],
  YOUTUBE: [
    { width: 1280, height: 720, label: 'Thumbnail' },
    { width: 1080, height: 1920, label: 'Short' },
  ],
  TWITTER: [
    { width: 1200, height: 675, label: 'Image' },
    { width: 1200, height: 1200, label: 'Square' },
  ],
  LINKEDIN: [
    { width: 1200, height: 627, label: 'Link Post' },
    { width: 1080, height: 1080, label: 'Feed Square' },
  ],
  FACEBOOK: [
    { width: 1200, height: 630, label: 'Feed' },
    { width: 1080, height: 1920, label: 'Story' },
  ],
  PINTEREST: [
    { width: 1000, height: 1500, label: 'Pin' },
  ],
  REDDIT: [
    { width: 1200, height: 628, label: 'Link Post' },
  ],
};

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * Processes an image buffer: resize and/or crop for a target platform.
 * Uses Sharp for server-side processing.
 *
 * NOTE: Sharp must be installed as a dependency: `npm install sharp`
 * This is designed to fail gracefully if Sharp is not available.
 */
export async function processImage(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  crop?: CropOptions,
): Promise<ProcessedImage> {
  try {
    // Dynamic import to make Sharp optional
    const sharp = (await import('sharp')).default;

    let pipeline = sharp(inputBuffer);

    if (crop) {
      pipeline = pipeline.extract({
        left: Math.round(crop.x),
        top: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
    }

    pipeline = pipeline.resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'centre',
    });

    const outputBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width ?? targetWidth,
      height: metadata.height ?? targetHeight,
      format: 'jpeg',
    };
  } catch (err) {
    logger.error('Image processing failed', err);
    throw new Error('Image processing failed. Ensure Sharp is installed.');
  }
}

/**
 * Returns recommended dimensions for a given platform.
 */
export function getRecommendedDimensions(platform: string) {
  return PLATFORM_DIMENSIONS[platform] ?? [];
}

/**
 * Validates that an image meets minimum platform requirements.
 */
export async function validateImageDimensions(
  inputBuffer: Buffer,
  minWidth: number,
  minHeight: number,
): Promise<{ valid: boolean; width: number; height: number }> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(inputBuffer).metadata();

    return {
      valid: (metadata.width ?? 0) >= minWidth && (metadata.height ?? 0) >= minHeight,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  } catch {
    return { valid: false, width: 0, height: 0 };
  }
}
