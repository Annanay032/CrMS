import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// ─── S3/R2 Client (lazy-initialized) ───────────────────────

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) {
    return null;
  }
  s3Client = new S3Client({
    region: env.S3_REGION || 'auto',
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for R2 and MinIO
  });
  logger.info('S3-compatible storage initialized', { endpoint: env.S3_ENDPOINT, bucket: env.S3_BUCKET });
  return s3Client;
}

export function isCloudStorageEnabled(): boolean {
  return !!getS3Client();
}

// ─── Upload a file (buffer or local path) to storage ────────

export async function uploadFile(
  filePathOrBuffer: string | Buffer,
  filename: string,
  mimeType: string,
): Promise<{ url: string; key: string }> {
  const client = getS3Client();

  if (client && env.S3_BUCKET) {
    // Cloud storage (R2/S3)
    const key = `uploads/${filename}`;
    const body = typeof filePathOrBuffer === 'string'
      ? createReadStream(filePathOrBuffer)
      : filePathOrBuffer;

    const upload = new Upload({
      client,
      params: {
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: mimeType,
      },
    });

    await upload.done();

    const publicUrl = env.S3_PUBLIC_URL
      ? `${env.S3_PUBLIC_URL}/${key}`
      : `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;

    logger.info(`Uploaded to cloud storage: ${key}`);
    return { url: publicUrl, key };
  }

  // Local storage fallback
  const uploadDir = env.UPLOAD_DIR;
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  if (typeof filePathOrBuffer === 'string') {
    // File is already on disk (multer saved it)
    return { url: `/uploads/${filename}`, key: filename };
  }

  // Buffer → write to disk
  const localPath = path.join(uploadDir, filename);
  writeFileSync(localPath, filePathOrBuffer);
  return { url: `/uploads/${filename}`, key: filename };
}

// ─── Upload from multer file (after multer saves to disk) ───

export async function uploadMulterFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
  const client = getS3Client();

  if (client && env.S3_BUCKET) {
    // Read from disk where multer saved it, upload to cloud
    const key = `uploads/${file.filename}`;
    const upload = new Upload({
      client,
      params: {
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    // Remove the local temporary file
    try { unlinkSync(file.path); } catch { /* ignore */ }

    const publicUrl = env.S3_PUBLIC_URL
      ? `${env.S3_PUBLIC_URL}/${key}`
      : `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;

    logger.info(`Uploaded to cloud storage: ${key}`, { originalName: file.originalname, size: file.size });
    return { url: publicUrl, key };
  }

  // Local storage — file already saved by multer
  return { url: `/uploads/${file.filename}`, key: file.filename };
}

// ─── Delete a file from storage ─────────────────────────────

export async function deleteFile(urlOrKey: string): Promise<void> {
  const client = getS3Client();

  if (client && env.S3_BUCKET) {
    // Extract key from URL or use as-is
    const key = urlOrKey.startsWith('uploads/')
      ? urlOrKey
      : urlOrKey.includes('/uploads/')
        ? `uploads/${urlOrKey.split('/uploads/').pop()}`
        : urlOrKey;

    await client.send(new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }));
    logger.info(`Deleted from cloud storage: ${key}`);
    return;
  }

  // Local storage
  const filename = urlOrKey.replace('/uploads/', '');
  const localPath = path.join(env.UPLOAD_DIR, filename);
  try { unlinkSync(localPath); } catch { /* file may not exist */ }
}

// ─── Download a file to a local temp path (for YouTube etc.) ──

export async function downloadToLocal(urlOrKey: string): Promise<string> {
  const client = getS3Client();

  if (client && env.S3_BUCKET) {
    const key = urlOrKey.startsWith('uploads/')
      ? urlOrKey
      : urlOrKey.includes('/uploads/')
        ? `uploads/${urlOrKey.split('/uploads/').pop()}`
        : urlOrKey;

    const resp = await client.send(new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }));

    const tmpDir = path.resolve(env.UPLOAD_DIR, '.tmp');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

    const tmpPath = path.join(tmpDir, `${randomUUID()}_${path.basename(key)}`);
    const bodyStream = resp.Body as NodeJS.ReadableStream;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      bodyStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      bodyStream.on('end', () => {
        writeFileSync(tmpPath, Buffer.concat(chunks));
        resolve(tmpPath);
      });
      bodyStream.on('error', reject);
    });
  }

  // Local storage — file is already local
  const filename = urlOrKey.replace('/uploads/', '');
  const localPath = path.resolve(env.UPLOAD_DIR, filename);
  if (!existsSync(localPath)) throw new Error(`File not found locally: ${localPath}`);
  return localPath;
}
