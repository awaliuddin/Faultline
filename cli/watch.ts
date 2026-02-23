import { watch, readFileSync, existsSync, statSync, type FSWatcher } from 'node:fs';
import { resolve, relative } from 'node:path';
import { scan, type ScanResult } from './scan.js';
import { renderReportAs, type OutputFormat } from './report.js';

const DEFAULT_DEBOUNCE_MS = 5000;

export interface WatchOptions {
  dir: string;
  provider?: string;
  minConfidence?: number;
  outputFormat?: OutputFormat;
  ruleNames?: string[];
  debounceMs?: number;
  /** Called with each scan result. Defaults to console.log. */
  onResult?: (file: string, output: string) => void;
  /** Called on errors. Defaults to console.error. */
  onError?: (file: string, error: string) => void;
}

export interface WatchHandle {
  close(): void;
}

/**
 * Debounce tracker — prevents re-scanning the same file within the debounce window.
 * Exported for testing.
 */
export class Debouncer {
  private lastScan = new Map<string, number>();
  private debounceMs: number;

  constructor(debounceMs: number = DEFAULT_DEBOUNCE_MS) {
    this.debounceMs = debounceMs;
  }

  /**
   * Returns true if the file should be scanned (not within debounce window).
   */
  shouldScan(filePath: string, now: number = Date.now()): boolean {
    const last = this.lastScan.get(filePath);
    if (last !== undefined && now - last < this.debounceMs) {
      return false;
    }
    return true;
  }

  /**
   * Record that a file was scanned at the given time.
   */
  record(filePath: string, now: number = Date.now()): void {
    this.lastScan.set(filePath, now);
  }

  /**
   * Get the last scan time for a file, or undefined.
   */
  getLastScan(filePath: string): number | undefined {
    return this.lastScan.get(filePath);
  }

  /**
   * Number of tracked files.
   */
  get size(): number {
    return this.lastScan.size;
  }

  /**
   * Clear all tracked files.
   */
  clear(): void {
    this.lastScan.clear();
  }
}

/**
 * Process a single file change event.
 * Exported for testing.
 */
export async function processFileChange(
  filePath: string,
  debouncer: Debouncer,
  options: {
    provider?: string;
    minConfidence?: number;
    outputFormat?: OutputFormat;
    ruleNames?: string[];
    onResult: (file: string, output: string) => void;
    onError: (file: string, error: string) => void;
  },
): Promise<boolean> {
  if (!debouncer.shouldScan(filePath)) {
    return false; // debounced
  }

  if (!existsSync(filePath)) {
    return false; // deleted
  }

  try {
    if (!statSync(filePath).isFile()) return false;
  } catch {
    return false;
  }

  const text = readFileSync(filePath, 'utf-8').trim();
  if (!text) return false;

  debouncer.record(filePath);

  try {
    const result = await scan(text, options.provider, options.minConfidence, options.ruleNames);
    const format = options.outputFormat || 'json';
    const output = renderReportAs(result, format);
    options.onResult(filePath, output);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    options.onError(filePath, msg);
    return false;
  }
}

/**
 * Start watching a directory for file changes.
 * Scans modified files incrementally with debounce.
 */
export function startWatch(options: WatchOptions): WatchHandle {
  const dir = resolve(options.dir);
  const debouncer = new Debouncer(options.debounceMs ?? DEFAULT_DEBOUNCE_MS);
  const onResult = options.onResult ?? ((file, output) => console.log(`\n--- ${file} ---\n${output}`));
  const onError = options.onError ?? ((file, err) => console.error(`[error] ${file}: ${err}`));

  const watcher: FSWatcher = watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const filePath = resolve(dir, filename);

    // Skip hidden files and node_modules
    if (filename.startsWith('.') || filename.includes('node_modules')) return;

    processFileChange(filePath, debouncer, {
      provider: options.provider,
      minConfidence: options.minConfidence,
      outputFormat: options.outputFormat,
      ruleNames: options.ruleNames,
      onResult: (file, output) => onResult(relative(dir, file), output),
      onError: (file, err) => onError(relative(dir, file), err),
    });
  });

  return {
    close() {
      watcher.close();
    },
  };
}
