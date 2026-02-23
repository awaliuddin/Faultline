import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
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
import { renderReport } from '../cli/report';
import type { ScanResult } from '../cli/scan';

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
    },
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
});
