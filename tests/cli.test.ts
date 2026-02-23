import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
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

import { main } from '../cli/index';
import { renderReport, renderReportAs } from '../cli/report';
import type { ScanResult, BatchScanResult } from '../cli/scan';

describe('CLI: main()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'faultline-test-'));
  });

  describe('version command', () => {
    it('should print version', async () => {
      const { exitCode, output } = await main(['version']);
      expect(exitCode).toBe(0);
      expect(output).toMatch(/Faultline v\d+\.\d+\.\d+/);
    });
  });

  describe('scan command', () => {
    it('should require --input flag', async () => {
      const { exitCode, output } = await main(['scan']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--input');
    });

    it('should error on missing file', async () => {
      const { exitCode, output } = await main(['scan', '--input', '/nonexistent/file.txt']);
      expect(exitCode).toBe(1);
      expect(output).toContain('File not found');
    });

    it('should error on empty file', async () => {
      const emptyFile = join(tmpDir, 'empty.txt');
      writeFileSync(emptyFile, '');
      const { exitCode, output } = await main(['scan', '--input', emptyFile]);
      expect(exitCode).toBe(1);
      expect(output).toContain('empty');
    });

    it('should scan with mock provider and output JSON', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees. The sky is blue.');

      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const result = JSON.parse(output) as ScanResult;
      expect(result.provider).toBe('Mock Provider');
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBeDefined();
      expect(result.complianceReport).toBeDefined();
      expect(result.complianceReport.euRiskSummary).toBeDefined();
    });

    it('mock provider should produce valid compliance report', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'AI recruitment tools screen candidates. Credit scoring uses machine learning.');

      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const result = JSON.parse(output) as ScanResult;
      expect(result.complianceReport.euRiskSummary.totalClaims).toBeGreaterThan(0);
      expect(result.complianceReport.mitigations.length).toBeGreaterThan(0);
    });

    it('should include confidence distribution in scan output', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees. The sky is blue.');

      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const result = JSON.parse(output) as ScanResult;
      expect(result.complianceReport.confidenceDistribution).toBeDefined();
      const cd = result.complianceReport.confidenceDistribution;
      expect(cd.high + cd.medium + cd.low).toBeGreaterThanOrEqual(0);
    });

    it('should filter claims with --min-confidence', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees. The sky is blue.');

      // Without filter
      const unfiltered = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      const unfilteredResult = JSON.parse(unfiltered.output) as ScanResult;
      const allMappings = unfilteredResult.complianceReport.claimMappings.length;

      // With high confidence filter — mock claims are all minimal (0.3) so all should be filtered
      const filtered = await main(['scan', '--input', inputFile, '--provider', 'mock', '--min-confidence', '0.5']);
      const filteredResult = JSON.parse(filtered.output) as ScanResult;
      expect(filteredResult.complianceReport.claimMappings.length).toBeLessThanOrEqual(allMappings);
    });

    it('should reject invalid --min-confidence values', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Test.');

      const bad1 = await main(['scan', '--input', inputFile, '--provider', 'mock', '--min-confidence', 'abc']);
      expect(bad1.exitCode).toBe(1);
      expect(bad1.output).toContain('--min-confidence');

      const bad2 = await main(['scan', '--input', inputFile, '--provider', 'mock', '--min-confidence', '1.5']);
      expect(bad2.exitCode).toBe(1);

      const bad3 = await main(['scan', '--input', inputFile, '--provider', 'mock', '--min-confidence', '-0.1']);
      expect(bad3.exitCode).toBe(1);
    });

    it('should output JSON by default', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      expect(exitCode).toBe(0);
      // Default is JSON
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should output markdown with --output-format markdown', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock', '--output-format', 'markdown']);
      expect(exitCode).toBe(0);
      expect(output).toContain('# Faultline Compliance Report');
      expect(output).toContain('## EU AI Act Risk Summary');
    });

    it('should output HTML with --output-format html', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock', '--output-format', 'html']);
      expect(exitCode).toBe(0);
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('Faultline Compliance Report');
      expect(output).toContain('</html>');
    });

    it('should reject invalid --output-format', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Test.');
      const { exitCode, output } = await main(['scan', '--input', inputFile, '--provider', 'mock', '--output-format', 'xml']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--output-format');
    });
  });

  describe('scan --dir (batch mode)', () => {
    it('should require --input or --dir', async () => {
      const { exitCode, output } = await main(['scan']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--input');
      expect(output).toContain('--dir');
    });

    it('should error on missing directory', async () => {
      const { exitCode, output } = await main(['scan', '--dir', '/nonexistent/dir']);
      expect(exitCode).toBe(1);
      expect(output).toContain('Directory not found');
    });

    it('should error when --dir points to a file', async () => {
      const file = join(tmpDir, 'afile.txt');
      writeFileSync(file, 'content');
      const { exitCode, output } = await main(['scan', '--dir', file]);
      expect(exitCode).toBe(1);
      expect(output).toContain('Not a directory');
    });

    it('should error when directory has no files', async () => {
      const emptyDir = join(tmpDir, 'empty');
      mkdirSync(emptyDir);
      const { exitCode, output } = await main(['scan', '--dir', emptyDir, '--provider', 'mock']);
      expect(exitCode).toBe(1);
      expect(output).toContain('No files found');
    });

    it('should scan all files in a directory', async () => {
      const scanDir = join(tmpDir, 'docs');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'a.txt'), 'Water boils at 100 degrees.');
      writeFileSync(join(scanDir, 'b.txt'), 'The sky is blue.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.filesScanned).toBe(2);
      expect(batch.results).toHaveLength(2);
      expect(batch.summary).toBeDefined();
      expect(batch.summary.totalClaims).toBeGreaterThan(0);
    });

    it('should scan recursively into subdirectories', async () => {
      const scanDir = join(tmpDir, 'nested');
      mkdirSync(scanDir);
      mkdirSync(join(scanDir, 'sub'));
      writeFileSync(join(scanDir, 'top.txt'), 'Claim one.');
      writeFileSync(join(scanDir, 'sub', 'deep.txt'), 'Claim two.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.filesScanned).toBe(2);
      // Relative paths
      const files = batch.results.map(r => r.file);
      expect(files).toContain('top.txt');
      expect(files.some(f => f.includes('deep.txt'))).toBe(true);
    });

    it('should filter files with --glob', async () => {
      const scanDir = join(tmpDir, 'mixed');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'readme.txt'), 'Water boils at 100 degrees.');
      writeFileSync(join(scanDir, 'code.py'), 'import os # Python code.');
      writeFileSync(join(scanDir, 'data.json'), '{"key": "value"}');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--glob', '*.txt', '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.filesScanned).toBe(1);
      expect(batch.glob).toBe('*.txt');
      expect(batch.results[0].file).toBe('readme.txt');
    });

    it('should error when glob matches no files', async () => {
      const scanDir = join(tmpDir, 'noglob');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'readme.txt'), 'Content.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--glob', '*.xyz', '--provider', 'mock']);
      expect(exitCode).toBe(1);
      expect(output).toContain('No files found');
      expect(output).toContain('*.xyz');
    });

    it('should skip empty files and count them', async () => {
      const scanDir = join(tmpDir, 'withempty');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'good.txt'), 'Valid content here.');
      writeFileSync(join(scanDir, 'empty.txt'), '');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.filesScanned).toBe(1);
      expect(batch.filesSkipped).toBe(1);
    });

    it('should aggregate summary across files', async () => {
      const scanDir = join(tmpDir, 'agg');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'a.txt'), 'First claim. Second claim.');
      writeFileSync(join(scanDir, 'b.txt'), 'Third claim.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.summary.totalClaims).toBeGreaterThanOrEqual(3);
      expect(batch.summary.riskCounts).toBeDefined();
      expect(batch.summary.highestRisk).toBeDefined();
      expect(batch.summary.euTierCounts).toBeDefined();
    });

    it('should include directory path and per-file results', async () => {
      const scanDir = join(tmpDir, 'meta');
      mkdirSync(scanDir);
      writeFileSync(join(scanDir, 'test.txt'), 'A claim about things.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.directory).toContain('meta');
      expect(batch.results[0].result.provider).toBe('Mock Provider');
      expect(batch.results[0].result.claims.length).toBeGreaterThan(0);
    });

    it('should skip hidden directories', async () => {
      const scanDir = join(tmpDir, 'withhidden');
      mkdirSync(scanDir);
      mkdirSync(join(scanDir, '.hidden'));
      writeFileSync(join(scanDir, 'visible.txt'), 'Visible content.');
      writeFileSync(join(scanDir, '.hidden', 'secret.txt'), 'Hidden content.');

      const { exitCode, output } = await main(['scan', '--dir', scanDir, '--provider', 'mock']);
      expect(exitCode).toBe(0);

      const batch = JSON.parse(output) as BatchScanResult;
      expect(batch.filesScanned).toBe(1);
      const files = batch.results.map(r => r.file);
      expect(files).toContain('visible.txt');
      expect(files.some(f => f.includes('secret'))).toBe(false);
    });
  });

  describe('rules command', () => {
    it('should list available rules', async () => {
      const { exitCode, output } = await main(['rules']);
      expect(exitCode).toBe(0);
      expect(output).toContain('pii');
      expect(output).toContain('bias');
      expect(output).toContain('toxicity');
      expect(output).toContain('Available rules');
    });
  });

  describe('init command', () => {
    it('should create .faultlinerc.json', async () => {
      const initDir = mkdtempSync(join(tmpdir(), 'faultline-init-'));
      const { exitCode, output } = await main(['init', '--dir', initDir]);
      expect(exitCode).toBe(0);
      expect(output).toContain('.faultlinerc.json');
      expect(existsSync(join(initDir, '.faultlinerc.json'))).toBe(true);
      rmSync(initDir, { recursive: true, force: true });
    });
  });

  describe('watch command', () => {
    it('should require --dir flag', async () => {
      const { exitCode, output } = await main(['watch']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--dir');
    });

    it('should error on missing directory', async () => {
      const { exitCode, output } = await main(['watch', '--dir', '/nonexistent/watch']);
      expect(exitCode).toBe(1);
      expect(output).toContain('Directory not found');
    });

    it('should error when --dir points to a file', async () => {
      const file = join(tmpDir, 'not-a-dir.txt');
      writeFileSync(file, 'content');
      const { exitCode, output } = await main(['watch', '--dir', file]);
      expect(exitCode).toBe(1);
      expect(output).toContain('Not a directory');
    });
  });

  describe('scan --rules', () => {
    it('should include rule findings in scan output', async () => {
      const file = join(tmpDir, 'pii-test.txt');
      writeFileSync(file, 'Contact john@example.com for details.');
      const { exitCode, output } = await main(['scan', '--input', file, '--provider', 'mock']);
      expect(exitCode).toBe(0);
      const result = JSON.parse(output);
      expect(result.ruleFindings).toBeDefined();
      expect(result.ruleFindings.length).toBeGreaterThanOrEqual(1);
      expect(result.ruleFindings.some((f: any) => f.ruleId === 'pii-email')).toBe(true);
    });

    it('should filter to specific rules with --rules', async () => {
      const file = join(tmpDir, 'rules-filter.txt');
      writeFileSync(file, 'Contact john@example.com, they said crazy things.');
      const { exitCode, output } = await main(['scan', '--input', file, '--provider', 'mock', '--rules', 'pii']);
      expect(exitCode).toBe(0);
      const result = JSON.parse(output);
      expect(result.ruleFindings.every((f: any) => f.ruleId.startsWith('pii'))).toBe(true);
    });

    it('should reject unknown rule name', async () => {
      const file = join(tmpDir, 'rules-bad.txt');
      writeFileSync(file, 'Some text.');
      const { exitCode, output } = await main(['scan', '--input', file, '--provider', 'mock', '--rules', 'nonexistent']);
      expect(exitCode).toBe(1);
      expect(output).toContain('Unknown rule');
      expect(output).toContain('nonexistent');
    });

    it('should accept comma-separated rule names', async () => {
      const file = join(tmpDir, 'multi-rule.txt');
      writeFileSync(file, 'Email john@test.com. SSN 123-45-6789.');
      const { exitCode, output } = await main(['scan', '--input', file, '--provider', 'mock', '--rules', 'pii,toxicity']);
      expect(exitCode).toBe(0);
      const result = JSON.parse(output);
      const ruleIds = result.ruleFindings.map((f: any) => f.ruleId);
      expect(ruleIds.some((id: string) => id.startsWith('pii'))).toBe(true);
    });

    it('should return empty findings for clean text', async () => {
      const file = join(tmpDir, 'clean.txt');
      writeFileSync(file, 'Quarterly revenue grew steadily.');
      const { exitCode, output } = await main(['scan', '--input', file, '--provider', 'mock']);
      expect(exitCode).toBe(0);
      const result = JSON.parse(output);
      expect(result.ruleFindings).toEqual([]);
    });
  });

  describe('report command', () => {
    it('should require --input flag', async () => {
      const { exitCode, output } = await main(['report']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--input');
    });

    it('should error on missing file', async () => {
      const { exitCode, output } = await main(['report', '--input', '/nonexistent/results.json']);
      expect(exitCode).toBe(1);
      expect(output).toContain('File not found');
    });

    it('should error on invalid JSON', async () => {
      const badFile = join(tmpDir, 'bad.json');
      writeFileSync(badFile, 'not json');
      const { exitCode, output } = await main(['report', '--input', badFile]);
      expect(exitCode).toBe(1);
      expect(output).toContain('Invalid JSON');
    });

    it('should render human-readable report from scan output', async () => {
      // First scan to get JSON
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees. The sky is blue.');
      const scanResult = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      const resultFile = join(tmpDir, 'results.json');
      writeFileSync(resultFile, scanResult.output);

      // Then render report
      const { exitCode, output } = await main(['report', '--input', resultFile]);
      expect(exitCode).toBe(0);
      expect(output).toContain('FAULTLINE COMPLIANCE REPORT');
      expect(output).toContain('Overall Risk:');
      expect(output).toContain('EU Risk Tier:');
      expect(output).toContain('END REPORT');
    });

    it('should render markdown report with --output-format markdown', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const scanResult = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      const resultFile = join(tmpDir, 'results.json');
      writeFileSync(resultFile, scanResult.output);

      const { exitCode, output } = await main(['report', '--input', resultFile, '--output-format', 'markdown']);
      expect(exitCode).toBe(0);
      expect(output).toContain('# Faultline Compliance Report');
    });

    it('should render HTML report with --output-format html', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const scanResult = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      const resultFile = join(tmpDir, 'results.json');
      writeFileSync(resultFile, scanResult.output);

      const { exitCode, output } = await main(['report', '--input', resultFile, '--output-format', 'html']);
      expect(exitCode).toBe(0);
      expect(output).toContain('<!DOCTYPE html>');
    });

    it('should reject invalid --output-format in report command', async () => {
      const inputFile = join(tmpDir, 'input.txt');
      writeFileSync(inputFile, 'Water boils at 100 degrees.');
      const scanResult = await main(['scan', '--input', inputFile, '--provider', 'mock']);
      const resultFile = join(tmpDir, 'results.json');
      writeFileSync(resultFile, scanResult.output);

      const { exitCode, output } = await main(['report', '--input', resultFile, '--output-format', 'csv']);
      expect(exitCode).toBe(1);
      expect(output).toContain('--output-format');
    });
  });

  describe('unknown/no command', () => {
    it('should show usage for unknown command', async () => {
      const { exitCode, output } = await main(['bogus']);
      expect(exitCode).toBe(1);
      expect(output).toContain('Unknown command: bogus');
      expect(output).toContain('Usage:');
    });

    it('should show usage with no arguments', async () => {
      const { exitCode, output } = await main([]);
      expect(exitCode).toBe(0);
      expect(output).toContain('Usage:');
    });
  });
});

describe('CLI: renderReport()', () => {
  const mockScanResult: ScanResult = {
    input: 'Test input text',
    provider: 'Mock Provider',
    claims: [{ id: 'c1', text: 'Test claim.', type: 'fact', importance: 5 }],
    verifications: {
      c1: { claimId: 'c1', status: 'supported', explanation: 'Confirmed.', sources: [] },
    },
    overallRisk: 'low',
    complianceReport: {
      generatedAt: '2026-02-22T00:00:00.000Z',
      overallRiskLevel: 'low',
      euRiskSummary: {
        unacceptable: 0,
        high: 0,
        limited: 0,
        minimal: 1,
        totalClaims: 1,
        highestTier: 'minimal',
      },
      claimMappings: [],
      triggeredArticles: [],
      mitigations: ['Consider voluntary codes of conduct.'],
      confidenceDistribution: { high: 0, medium: 0, low: 1 },
    },
    ruleFindings: [],
  };

  it('should include header and footer', () => {
    const output = renderReport(mockScanResult);
    expect(output).toContain('=== FAULTLINE COMPLIANCE REPORT ===');
    expect(output).toContain('=== END REPORT ===');
  });

  it('should include provider and risk level', () => {
    const output = renderReport(mockScanResult);
    expect(output).toContain('Mock Provider');
    expect(output).toContain('LOW');
    expect(output).toContain('MINIMAL');
  });

  it('should include claim verification details', () => {
    const output = renderReport(mockScanResult);
    expect(output).toContain('[OK] c1: supported');
  });

  it('should include mitigations', () => {
    const output = renderReport(mockScanResult);
    expect(output).toContain('voluntary codes');
  });

  it('should include confidence distribution section', () => {
    const withConfidence: ScanResult = {
      ...mockScanResult,
      complianceReport: {
        ...mockScanResult.complianceReport,
        confidenceDistribution: { high: 2, medium: 1, low: 0 },
      },
    };
    const output = renderReport(withConfidence);
    expect(output).toContain('Confidence Distribution');
    expect(output).toContain('High (>=0.8):   2');
    expect(output).toContain('Medium (0.5-0.8): 1');
    expect(output).toContain('Low (<0.5):     0');
  });

  it('should show per-claim confidence scores when claimMappings exist', () => {
    const withMappings: ScanResult = {
      ...mockScanResult,
      complianceReport: {
        ...mockScanResult.complianceReport,
        claimMappings: [{
          claimId: 'c1',
          claimText: 'Test',
          verificationStatus: 'supported',
          riskLevel: 'minimal',
          category: { level: 'minimal', title: 'Minimal', description: '', articles: [], requiredActions: [] },
          matchedPatterns: [],
          confidence: 'low',
          confidenceScore: 0.3,
        }],
        confidenceDistribution: { high: 0, medium: 0, low: 1 },
      },
    };
    const output = renderReport(withMappings);
    expect(output).toContain('confidence: 0.30');
  });
});

describe('CLI: renderReportAs()', () => {
  const mockData: ScanResult = {
    input: 'Test input',
    provider: 'Mock Provider',
    claims: [{ id: 'c1', text: 'Earth is round.', type: 'fact', importance: 5 }],
    verifications: {
      c1: { claimId: 'c1', status: 'supported', explanation: 'Confirmed.', sources: [] },
    },
    overallRisk: 'low',
    complianceReport: {
      generatedAt: '2026-02-22T00:00:00.000Z',
      overallRiskLevel: 'low',
      euRiskSummary: { unacceptable: 0, high: 0, limited: 0, minimal: 1, totalClaims: 1, highestTier: 'minimal' },
      claimMappings: [{
        claimId: 'c1', claimText: 'Earth is round.', verificationStatus: 'supported',
        riskLevel: 'minimal',
        category: { level: 'minimal', title: 'Minimal', description: '', articles: [], requiredActions: [] },
        matchedPatterns: [], confidence: 'low', confidenceScore: 0.3,
      }],
      triggeredArticles: [{ article: 'Recital 32', reason: 'Minimal risk', claimIds: ['c1'] }],
      mitigations: ['Consider voluntary codes of conduct.'],
      confidenceDistribution: { high: 0, medium: 0, low: 1 },
    },
    ruleFindings: [],
  };

  describe('json format', () => {
    it('should return valid JSON', () => {
      const output = renderReportAs(mockData, 'json');
      const parsed = JSON.parse(output);
      expect(parsed.provider).toBe('Mock Provider');
      expect(parsed.overallRisk).toBe('low');
    });
  });

  describe('markdown format', () => {
    it('should have h1 title', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('# Faultline Compliance Report');
    });

    it('should include risk summary table', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('## EU AI Act Risk Summary');
      expect(output).toContain('| Risk Level | Count |');
    });

    it('should include confidence distribution table', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('## Confidence Distribution');
      expect(output).toContain('High');
      expect(output).toContain('Medium');
      expect(output).toContain('Low');
    });

    it('should include claim verifications table with confidence scores', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('## Claim Verifications');
      expect(output).toContain('c1');
      expect(output).toContain('0.30');
    });

    it('should include triggered articles table', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('## Triggered EU AI Act Articles');
      expect(output).toContain('Recital 32');
    });

    it('should include mitigations list', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('## Recommended Mitigations');
      expect(output).toContain('- Consider voluntary codes');
    });

    it('should include footer', () => {
      const output = renderReportAs(mockData, 'markdown');
      expect(output).toContain('Generated by');
    });

    it('should include color-coded risk badges', () => {
      const output = renderReportAs(mockData, 'markdown');
      // Should contain emoji badges
      expect(output).toMatch(/🟢|🟡|🟠|🔴/);
    });
  });

  describe('html format', () => {
    it('should be a complete HTML document', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<html');
      expect(output).toContain('</html>');
    });

    it('should have embedded CSS (no external deps)', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('<style>');
      expect(output).not.toContain('<link rel="stylesheet"');
    });

    it('should include the title', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('<title>Faultline Compliance Report</title>');
    });

    it('should include provider info', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('Mock Provider');
    });

    it('should include risk summary table', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('EU AI Act Risk Summary');
      expect(output).toContain('Unacceptable');
      expect(output).toContain('Minimal');
    });

    it('should include confidence distribution', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('Confidence Distribution');
    });

    it('should include claim verifications', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('Claim Verifications');
      expect(output).toContain('c1');
      expect(output).toContain('0.30');
    });

    it('should include triggered articles', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('Triggered EU AI Act Articles');
      expect(output).toContain('Recital 32');
    });

    it('should include mitigations', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('Recommended Mitigations');
      expect(output).toContain('voluntary codes');
    });

    it('should escape HTML entities in claim text', () => {
      const dataWithHtml: ScanResult = {
        ...mockData,
        verifications: {
          c1: { claimId: 'c1', status: 'supported', explanation: 'Has <script>alert("xss")</script>', sources: [] },
        },
      };
      const output = renderReportAs(dataWithHtml, 'html');
      expect(output).not.toContain('<script>alert');
      expect(output).toContain('&lt;script&gt;');
    });

    it('should include color-coded badges', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('class="badge"');
      expect(output).toContain('background:');
    });

    it('should have a footer', () => {
      const output = renderReportAs(mockData, 'html');
      expect(output).toContain('<footer>');
      expect(output).toContain('Faultline');
    });
  });
});
