import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { ImageInput } from '../providers/base_provider.js';

const SUPPORTED_MIME: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
};

export function isBinaryFile(filePath: string): boolean {
  return extname(filePath).toLowerCase() in SUPPORTED_MIME;
}

export function getImageInput(filePath: string): ImageInput | null {
  const ext = extname(filePath).toLowerCase();
  const mimeType = SUPPORTED_MIME[ext];
  if (!mimeType) return null;

  const buffer = readFileSync(filePath);
  const data = buffer.toString('base64');
  return { data, mimeType };
}
