import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isBinaryFile, getImageInput } from '../multimodal/extractor.js';

describe('isBinaryFile', () => {
  it.each([
    ['/docs/report.pdf', true],
    ['/imgs/photo.png', true],
    ['/imgs/photo.jpg', true],
    ['/imgs/photo.jpeg', true],
    ['/imgs/photo.webp', true],
    ['/imgs/animation.gif', true],
    ['/data/claims.txt', false],
    ['/data/claims.md', false],
    ['/data/claims.json', false],
    ['/data/claims', false],
  ])('%s → %s', (path, expected) => {
    expect(isBinaryFile(path)).toBe(expected);
  });

  it('is case-insensitive for extension', () => {
    expect(isBinaryFile('/file.PDF')).toBe(true);
    expect(isBinaryFile('/file.PNG')).toBe(true);
    expect(isBinaryFile('/file.JPEG')).toBe(true);
  });
});

describe('getImageInput', () => {
  it('returns null for unsupported extension', () => {
    // isBinaryFile guards the read; we only test the null path here
    expect(getImageInput('/data/claims.txt')).toBeNull();
    expect(getImageInput('/data/claims.json')).toBeNull();
    expect(getImageInput('/data/claims')).toBeNull();
  });

  it('returns correct MIME type and base64 data for PDF', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const filePath = join(dir, 'sample.pdf');
    const content = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF magic bytes
    writeFileSync(filePath, content);

    try {
      const result = getImageInput(filePath);
      expect(result).not.toBeNull();
      expect(result!.mimeType).toBe('application/pdf');
      expect(result!.data).toBe(content.toString('base64'));
      // Round-trip
      expect(Buffer.from(result!.data, 'base64')).toEqual(content);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('returns correct MIME type for PNG', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const filePath = join(dir, 'image.png');
    writeFileSync(filePath, Buffer.from('fake-png'));
    try {
      expect(getImageInput(filePath)!.mimeType).toBe('image/png');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('returns correct MIME type for JPEG extensions', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const jpg = join(dir, 'a.jpg');
    const jpeg = join(dir, 'b.jpeg');
    writeFileSync(jpg, Buffer.from('fake-jpg'));
    writeFileSync(jpeg, Buffer.from('fake-jpeg'));
    try {
      expect(getImageInput(jpg)!.mimeType).toBe('image/jpeg');
      expect(getImageInput(jpeg)!.mimeType).toBe('image/jpeg');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('returns correct MIME type for WEBP', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const filePath = join(dir, 'image.webp');
    writeFileSync(filePath, Buffer.from('fake-webp'));
    try {
      expect(getImageInput(filePath)!.mimeType).toBe('image/webp');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('returns correct MIME type for GIF', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const filePath = join(dir, 'anim.gif');
    writeFileSync(filePath, Buffer.from('GIF89a'));
    try {
      expect(getImageInput(filePath)!.mimeType).toBe('image/gif');
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it('base64 round-trip preserves binary content', () => {
    const dir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
    const filePath = join(dir, 'data.pdf');
    const original = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x42]);
    writeFileSync(filePath, original);
    try {
      const result = getImageInput(filePath);
      const decoded = Buffer.from(result!.data, 'base64');
      expect(decoded).toEqual(original);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
