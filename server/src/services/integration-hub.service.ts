/**
 * Integration Hub — Abstraction layer for external creative APIs.
 *
 * Each integration (OpenAI Images, HeyGen, ElevenLabs, Canva, Adobe Firefly, Picsart)
 * is exposed through a unified interface. API keys are read from environment variables
 * and integrations gracefully degrade when keys aren't configured.
 */

import { openai } from '../config/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// ─── Types ──────────────────────────────────────────────────

export interface IntegrationStatus {
  id: string;
  name: string;
  available: boolean;
  reason?: string;
}

export interface GenerateImageResult {
  url?: string;
  base64?: string;
  revisedPrompt?: string;
}

export interface TextToSpeechResult {
  audioUrl?: string;
  audioBase64?: string;
  durationMs?: number;
}

export interface RemoveBackgroundResult {
  url?: string;
  base64?: string;
}

export type IntegrationId = 'openai-image' | 'heygen' | 'elevenlabs' | 'canva' | 'firefly' | 'picsart';

// ─── Status ─────────────────────────────────────────────────

export function getIntegrationStatuses(): IntegrationStatus[] {
  return [
    {
      id: 'openai-image',
      name: 'OpenAI Image Generation',
      available: !!env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'sk-placeholder',
      reason: !env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-placeholder' ? 'OPENAI_API_KEY not configured' : undefined,
    },
    {
      id: 'heygen',
      name: 'HeyGen Video',
      available: false,
      reason: 'HEYGEN_API_KEY not configured',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs Voice',
      available: false,
      reason: 'ELEVENLABS_API_KEY not configured',
    },
    {
      id: 'canva',
      name: 'Canva Connect',
      available: false,
      reason: 'CANVA_API_KEY not configured',
    },
    {
      id: 'firefly',
      name: 'Adobe Firefly',
      available: false,
      reason: 'ADOBE_FIREFLY_API_KEY not configured',
    },
    {
      id: 'picsart',
      name: 'Picsart',
      available: false,
      reason: 'PICSART_API_KEY not configured',
    },
  ];
}

// ─── OpenAI Image Generation ────────────────────────────────

export async function generateImage(
  prompt: string,
  options: { size?: string; quality?: string; style?: string } = {},
): Promise<GenerateImageResult> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-placeholder') {
    throw new Error('OpenAI API key not configured');
  }

  const size = (options.size || '1024x1024') as '1024x1024' | '1792x1024' | '1024x1792';

  logger.info(`Integration Hub: generating image, prompt="${prompt.slice(0, 80)}..."`);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality: (options.quality as 'standard' | 'hd') || 'standard',
    style: (options.style as 'vivid' | 'natural') || 'vivid',
  });

  const imageData = response.data?.[0];
  return {
    url: imageData?.url,
    revisedPrompt: imageData?.revised_prompt,
  };
}

// ─── OpenAI Image Edit ──────────────────────────────────────

export async function editImage(
  imageBase64: string,
  prompt: string,
  maskBase64?: string,
): Promise<GenerateImageResult> {
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-placeholder') {
    throw new Error('OpenAI API key not configured');
  }

  logger.info(`Integration Hub: editing image, prompt="${prompt.slice(0, 80)}..."`);

  // Convert base64 to File objects for the API
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' });

  const params: Parameters<typeof openai.images.edit>[0] = {
    model: 'dall-e-2',
    image: imageFile,
    prompt,
    n: 1,
    size: '1024x1024',
  };

  if (maskBase64) {
    const maskBuffer = Buffer.from(maskBase64, 'base64');
    params.mask = new File([maskBuffer], 'mask.png', { type: 'image/png' });
  }

  const response = await openai.images.edit(params);
  return { url: response.data?.[0]?.url };
}

// ─── Text-to-Speech (placeholder for ElevenLabs) ───────────

export async function textToSpeech(
  _text: string,
  _options: { voice?: string; model?: string } = {},
): Promise<TextToSpeechResult> {
  throw new Error('ElevenLabs integration not configured. Set ELEVENLABS_API_KEY in environment.');
}

// ─── Remove Background (placeholder for Picsart) ───────────

export async function removeBackground(
  _imageBase64: string,
): Promise<RemoveBackgroundResult> {
  throw new Error('Picsart integration not configured. Set PICSART_API_KEY in environment.');
}

// ─── Upscale Image (placeholder for Picsart) ───────────────

export async function upscaleImage(
  _imageBase64: string,
  _factor: number = 2,
): Promise<RemoveBackgroundResult> {
  throw new Error('Picsart integration not configured. Set PICSART_API_KEY in environment.');
}
