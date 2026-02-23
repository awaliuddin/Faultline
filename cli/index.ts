#!/usr/bin/env npx tsx
/**
 * Faultline CLI — scan text, generate compliance reports.
 *
 * Usage:
 *   npx tsx cli/index.ts scan --input <file> [--provider gemini|claude|mock]
 *   npx tsx cli/index.ts report --input <results.json>
 *   npx tsx cli/index.ts version
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { scan, batchScan } from './scan.js';
import { renderReport, renderReportAs, type OutputFormat } from './report.js';
import { listRules, getRule } from '../rules/index.js';
import { loadConfig, mergeFlags, generateSampleConfig } from './config.js';
import { startWatch } from './watch.js';

const VERSION = '0.1.0';

function usage(): string {
  return `Faultline CLI v${VERSION}

Usage:
  faultline scan --input <file> [--provider gemini|claude|mock] [--min-confidence 0.0-1.0] [--output-format json|markdown|html] [--rules pii,bias,toxicity]
  faultline scan --dir <path> [--glob "*.txt"] [--provider mock] [--min-confidence 0.0-1.0] [--output-format json|markdown|html] [--rules pii]
  faultline report --input <results.json> [--output-format json|markdown|html]
  faultline watch --dir <path> [--provider mock] [--output-format json]   Watch for changes
  faultline rules                                                List available rules
  faultline init                                                 Generate .faultlinerc.json
  faultline version                                              Print version

Config:
  Reads .faultlinerc.json from cwd (walks up). CLI flags override config values.

Environment:
  GEMINI_API_KEY       API key for Gemini provider
  ANTHROPIC_API_KEY    API key for Claude provider
  FAULTLINE_PROVIDER   Default provider (gemini|claude)`;
}

function parseArgs(args: string[]): { command: string; flags: Record<string, string> } {
  const command = args[0] || '';
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  return { command, flags };
}

export async function main(args: string[]): Promise<{ exitCode: number; output: string }> {
  const { command, flags } = parseArgs(args);

  switch (command) {
    case 'version':
      return { exitCode: 0, output: `Faultline v${VERSION}` };

    case 'rules': {
      const rules = listRules();
      const lines = ['Available rules:', ''];
      for (const name of rules) {
        const rule = getRule(name);
        lines.push(`  ${rule.id.padEnd(12)} ${rule.name} — ${rule.description}`);
      }
      return { exitCode: 0, output: lines.join('\n') };
    }

    case 'init': {
      const targetDir = flags['dir'] || process.cwd();
      const filePath = generateSampleConfig(targetDir);
      return { exitCode: 0, output: `Created ${filePath}` };
    }

    case 'watch': {
      const watchDir = flags['dir'];
      if (!watchDir) {
        return { exitCode: 1, output: 'Error: --dir <path> is required for watch mode.\n\n' + usage() };
      }

      const resolvedDir = resolve(watchDir);
      if (!existsSync(resolvedDir)) {
        return { exitCode: 1, output: `Error: Directory not found: ${resolvedDir}` };
      }
      try {
        if (!statSync(resolvedDir).isDirectory()) {
          return { exitCode: 1, output: `Error: Not a directory: ${resolvedDir}` };
        }
      } catch {
        return { exitCode: 1, output: `Error: Cannot read: ${resolvedDir}` };
      }

      const config = loadConfig();
      const { provider: providerName, minConfidence, outputFormat, ruleNames } = mergeFlags(config, flags);

      startWatch({
        dir: resolvedDir,
        provider: providerName,
        minConfidence,
        outputFormat,
        ruleNames,
      });

      return { exitCode: 0, output: `Watching ${resolvedDir} for changes... (Ctrl+C to stop)` };
    }

    case 'scan': {
      const inputPath = flags['input'];
      const dirPath = flags['dir'];

      if (!inputPath && !dirPath) {
        return { exitCode: 1, output: 'Error: --input <file> or --dir <path> is required.\n\n' + usage() };
      }

      // Load config file (walks up from cwd), then merge with CLI flags
      const config = loadConfig();
      const { provider: providerName, minConfidence, outputFormat, ruleNames } = mergeFlags(config, flags);

      if (minConfidence !== undefined && (isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1)) {
        return { exitCode: 1, output: 'Error: --min-confidence must be a number between 0.0 and 1.0.' };
      }
      if (!['json', 'markdown', 'html'].includes(outputFormat)) {
        return { exitCode: 1, output: 'Error: --output-format must be json, markdown, or html.' };
      }

      if (ruleNames) {
        const available = listRules();
        for (const name of ruleNames) {
          if (!available.includes(name)) {
            return { exitCode: 1, output: `Error: Unknown rule "${name}". Available: ${available.join(', ')}` };
          }
        }
      }

      // --- Directory/batch mode ---
      if (dirPath) {
        const resolvedDir = resolve(dirPath);
        if (!existsSync(resolvedDir)) {
          return { exitCode: 1, output: `Error: Directory not found: ${resolvedDir}` };
        }
        try {
          if (!statSync(resolvedDir).isDirectory()) {
            return { exitCode: 1, output: `Error: Not a directory: ${resolvedDir}` };
          }
        } catch {
          return { exitCode: 1, output: `Error: Cannot read: ${resolvedDir}` };
        }

        const globPattern = flags['glob'] || undefined;
        const batchResult = await batchScan(resolvedDir, providerName, minConfidence, globPattern);

        if (batchResult.filesScanned === 0) {
          return { exitCode: 1, output: `Error: No files found in ${resolvedDir}${globPattern ? ` matching "${globPattern}"` : ''}.` };
        }

        return { exitCode: 0, output: JSON.stringify(batchResult, null, 2) };
      }

      // --- Single file mode ---
      const resolved = resolve(inputPath!);
      if (!existsSync(resolved)) {
        return { exitCode: 1, output: `Error: File not found: ${resolved}` };
      }

      const text = readFileSync(resolved, 'utf-8').trim();
      if (!text) {
        return { exitCode: 1, output: 'Error: Input file is empty.' };
      }

      const result = await scan(text, providerName, minConfidence, ruleNames);
      return { exitCode: 0, output: renderReportAs(result, outputFormat) };
    }

    case 'report': {
      const inputPath = flags['input'];
      if (!inputPath) {
        return { exitCode: 1, output: 'Error: --input <results.json> is required.\n\n' + usage() };
      }

      const resolved = resolve(inputPath);
      if (!existsSync(resolved)) {
        return { exitCode: 1, output: `Error: File not found: ${resolved}` };
      }

      try {
        const data = JSON.parse(readFileSync(resolved, 'utf-8'));
        const outputFormat = (flags['output-format'] || undefined) as OutputFormat | undefined;
        if (outputFormat && !['json', 'markdown', 'html'].includes(outputFormat)) {
          return { exitCode: 1, output: 'Error: --output-format must be json, markdown, or html.' };
        }
        const output = outputFormat ? renderReportAs(data, outputFormat) : renderReport(data);
        return { exitCode: 0, output };
      } catch {
        return { exitCode: 1, output: 'Error: Invalid JSON in input file.' };
      }
    }

    default:
      return { exitCode: command ? 1 : 0, output: (command ? `Unknown command: ${command}\n\n` : '') + usage() };
  }
}

// Run when executed directly
const isDirectRun = process.argv[1]?.includes('cli/index');
if (isDirectRun) {
  main(process.argv.slice(2)).then(({ exitCode, output }) => {
    console.log(output);
    process.exit(exitCode);
  });
}
