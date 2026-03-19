import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';

// ─── Cloud Import Service ───────────────────────────────────
// Handles importing media from Google Drive, Dropbox, and Canva
// into the CrMS media library.

export interface ImportedFile {
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

/**
 * Import files from Google Drive via server-side download.
 * The frontend obtains fileIds via Google Picker API, then sends them here.
 */
export async function importFromGoogleDrive(
  userId: string,
  files: Array<{ fileId: string; accessToken: string }>,
): Promise<ImportedFile[]> {
  const results: ImportedFile[] = [];

  for (const { fileId, accessToken } of files) {
    try {
      // Get file metadata
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,size`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!metaRes.ok) {
        logger.warn(`Google Drive metadata fetch failed for ${fileId}: ${metaRes.status}`);
        continue;
      }

      const meta = (await metaRes.json()) as { name: string; mimeType: string; size: string };

      // Download file content
      const dlRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!dlRes.ok) {
        logger.warn(`Google Drive download failed for ${fileId}: ${dlRes.status}`);
        continue;
      }

      // Store in media library
      const media = await prisma.mediaAsset.create({
        data: {
          userId,
          filename: meta.name,
          mimeType: meta.mimeType,
          size: parseInt(meta.size, 10) || 0,
          url: `drive://${fileId}`, // placeholder — real impl would save to storage
          source: 'GOOGLE_DRIVE',
        },
      });

      results.push({
        originalName: meta.name,
        url: media.url,
        mimeType: meta.mimeType,
        size: media.size,
      });
    } catch (err) {
      logger.error(`Google Drive import error for file ${fileId}`, err);
    }
  }

  return results;
}

/**
 * Import files from Dropbox via shared link.
 * Frontend uses Dropbox Chooser to get file URLs.
 */
export async function importFromDropbox(
  userId: string,
  files: Array<{ url: string; name: string; bytes: number }>,
): Promise<ImportedFile[]> {
  const results: ImportedFile[] = [];

  for (const file of files) {
    try {
      const media = await prisma.mediaAsset.create({
        data: {
          userId,
          filename: file.name,
          mimeType: guessMimeType(file.name),
          size: file.bytes,
          url: file.url,
          source: 'DROPBOX',
        },
      });

      results.push({
        originalName: file.name,
        url: media.url,
        mimeType: media.mimeType,
        size: media.size,
      });
    } catch (err) {
      logger.error(`Dropbox import error for ${file.name}`, err);
    }
  }

  return results;
}

/**
 * Import a design from Canva.
 * Frontend uses Canva Button SDK to get a design export URL.
 */
export async function importFromCanva(
  userId: string,
  design: { exportUrl: string; title: string },
): Promise<ImportedFile | null> {
  try {
    const media = await prisma.mediaAsset.create({
      data: {
        userId,
        filename: `${design.title}.png`,
        mimeType: 'image/png',
        size: 0,
        url: design.exportUrl,
        source: 'CANVA',
      },
    });

    return {
      originalName: design.title,
      url: media.url,
      mimeType: 'image/png',
      size: 0,
    };
  } catch (err) {
    logger.error('Canva import error', err);
    return null;
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4', mov: 'video/quicktime',
    avi: 'video/x-msvideo', pdf: 'application/pdf',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}
