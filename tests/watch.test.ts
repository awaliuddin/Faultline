import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock @google/genai so provider imports don't blow up
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: vi.fn() };
  },
}));

// Mock fetch for Claude provider
vi.stubGlobal('fetch', vi.fn());

import { Debouncer, processFileChange } from '../cli/watch';

// ---------- Debouncer ----------

describe('Debouncer', () => {
  it('should allow first scan of a file', () => {
    const d = new Debouncer(5000);
    expect(d.shouldScan('/tmp/file.txt')).toBe(true);
  });

  it('should block scan within debounce window', () => {
    const d = new Debouncer(5000);
    const now = 10000;
    d.record('/tmp/file.txt', now);
    expect(d.shouldScan('/tmp/file.txt', now + 1000)).toBe(false);
    expect(d.shouldScan('/tmp/file.txt', now + 4999)).toBe(false);
  });

  it('should allow scan after debounce window expires', () => {
    const d = new Debouncer(5000);
    const now = 10000;
    d.record('/tmp/file.txt', now);
    expect(d.shouldScan('/tmp/file.txt', now + 5000)).toBe(true);
    expect(d.shouldScan('/tmp/file.txt', now + 6000)).toBe(true);
  });

  it('should track files independently', () => {
    const d = new Debouncer(5000);
    const now = 10000;
    d.record('/tmp/a.txt', now);
    expect(d.shouldScan('/tmp/a.txt', now + 1000)).toBe(false);
    expect(d.shouldScan('/tmp/b.txt', now + 1000)).toBe(true);
  });

  it('should use custom debounce interval', () => {
    const d = new Debouncer(1000);
    const now = 10000;
    d.record('/tmp/file.txt', now);
    expect(d.shouldScan('/tmp/file.txt', now + 999)).toBe(false);
    expect(d.shouldScan('/tmp/file.txt', now + 1000)).toBe(true);
  });

  it('should report size', () => {
    const d = new Debouncer();
    expect(d.size).toBe(0);
    d.record('/tmp/a.txt');
    expect(d.size).toBe(1);
    d.record('/tmp/b.txt');
    expect(d.size).toBe(2);
  });

  it('should clear all tracked files', () => {
    const d = new Debouncer();
    d.record('/tmp/a.txt');
    d.record('/tmp/b.txt');
    d.clear();
    expect(d.size).toBe(0);
    expect(d.shouldScan('/tmp/a.txt')).toBe(true);
  });

  it('should return last scan time', () => {
    const d = new Debouncer();
    expect(d.getLastScan('/tmp/a.txt')).toBeUndefined();
    d.record('/tmp/a.txt', 12345);
    expect(d.getLastScan('/tmp/a.txt')).toBe(12345);
  });

  it('should update last scan on re-record', () => {
    const d = new Debouncer(5000);
    d.record('/tmp/file.txt', 10000);
    d.record('/tmp/file.txt', 20000);
    expect(d.getLastScan('/tmp/file.txt')).toBe(20000);
    // Should block within 5s of second record
    expect(d.shouldScan('/tmp/file.txt', 24000)).toBe(false);
    expect(d.shouldScan('/tmp/file.txt', 25000)).toBe(true);
  });

  it('should default debounce to 5000ms', () => {
    const d = new Debouncer();
    const now = 10000;
    d.record('/tmp/file.txt', now);
    expect(d.shouldScan('/tmp/file.txt', now + 4999)).toBe(false);
    expect(d.shouldScan('/tmp/file.txt', now + 5000)).toBe(true);
  });
});

// ---------- processFileChange ----------

describe('processFileChange', () => {
  let tmpDir: string;
  let debouncer: Debouncer;
  let results: Array<{ file: string; output: string }>;
  let errors: Array<{ file: string; error: string }>;

  const opts = () => ({
    provider: 'mock' as const,
    onResult: (file: string, output: string) => results.push({ file, output }),
    onError: (file: string, error: string) => errors.push({ file, error }),
  });

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'faultline-watch-'));
    debouncer = new Debouncer(5000);
    results = [];
    errors = [];
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should scan a valid file and emit result', async () => {
    const file = join(tmpDir, 'test.txt');
    writeFileSync(file, 'The Earth is round. Water is wet.');
    const scanned = await processFileChange(file, debouncer, opts());
    expect(scanned).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].file).toBe(file);
    expect(results[0].output.length).toBeGreaterThan(0);
  });

  it('should return false for debounced file', async () => {
    const file = join(tmpDir, 'debounced.txt');
    writeFileSync(file, 'Some content.');
    await processFileChange(file, debouncer, opts());
    expect(results.length).toBe(1);

    // Second call within debounce window
    const scanned = await processFileChange(file, debouncer, opts());
    expect(scanned).toBe(false);
    expect(results.length).toBe(1); // no new result
  });

  it('should return false for nonexistent file', async () => {
    const scanned = await processFileChange('/nonexistent/file.txt', debouncer, opts());
    expect(scanned).toBe(false);
    expect(results.length).toBe(0);
  });

  it('should return false for empty file', async () => {
    const file = join(tmpDir, 'empty.txt');
    writeFileSync(file, '');
    const scanned = await processFileChange(file, debouncer, opts());
    expect(scanned).toBe(false);
  });

  it('should return false for directory', async () => {
    const dir = join(tmpDir, 'subdir');
    mkdirSync(dir);
    const scanned = await processFileChange(dir, debouncer, opts());
    expect(scanned).toBe(false);
  });

  it('should record scan time after successful scan', async () => {
    const file = join(tmpDir, 'record.txt');
    writeFileSync(file, 'Content here.');
    expect(debouncer.getLastScan(file)).toBeUndefined();
    await processFileChange(file, debouncer, opts());
    expect(debouncer.getLastScan(file)).toBeDefined();
  });

  it('should parse scan result as JSON', async () => {
    const file = join(tmpDir, 'json-check.txt');
    writeFileSync(file, 'The sky is blue. Gravity pulls down.');
    await processFileChange(file, debouncer, opts());
    const parsed = JSON.parse(results[0].output);
    expect(parsed.provider).toBe('Mock Provider');
    expect(parsed.claims).toBeDefined();
    expect(parsed.ruleFindings).toBeDefined();
  });
});
