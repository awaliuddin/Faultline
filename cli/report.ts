import type { ComplianceReport } from '../compliance/report_generator.js';
import type { ScanResult } from './scan.js';

/**
 * Render a human-readable summary from a scan result JSON.
 */
export function renderReport(data: ScanResult): string {
  const lines: string[] = [];
  const report = data.complianceReport;

  lines.push('=== FAULTLINE COMPLIANCE REPORT ===');
  lines.push('');
  lines.push(`Provider:     ${data.provider}`);
  lines.push(`Overall Risk: ${data.overallRisk.toUpperCase()}`);
  lines.push(`EU Risk Tier: ${report.euRiskSummary.highestTier.toUpperCase()}`);
  lines.push(`Generated:    ${report.generatedAt}`);
  lines.push('');

  // Risk summary
  lines.push('--- EU AI Act Risk Summary ---');
  lines.push(`  Unacceptable: ${report.euRiskSummary.unacceptable}`);
  lines.push(`  High:         ${report.euRiskSummary.high}`);
  lines.push(`  Limited:      ${report.euRiskSummary.limited}`);
  lines.push(`  Minimal:      ${report.euRiskSummary.minimal}`);
  lines.push(`  Total Claims: ${report.euRiskSummary.totalClaims}`);
  lines.push('');

  // Claim verifications
  if (Object.keys(data.verifications).length > 0) {
    lines.push('--- Claim Verifications ---');
    for (const [claimId, result] of Object.entries(data.verifications)) {
      const icon =
        result.status === 'supported' ? '[OK]'
        : result.status === 'contradicted' ? '[!!]'
        : result.status === 'mixed' ? '[??]'
        : '[--]';
      lines.push(`  ${icon} ${claimId}: ${result.status} — ${result.explanation}`);
    }
    lines.push('');
  }

  // Triggered articles
  if (report.triggeredArticles.length > 0) {
    lines.push('--- Triggered EU AI Act Articles ---');
    for (const article of report.triggeredArticles) {
      lines.push(`  ${article.article}: ${article.reason} (claims: ${article.claimIds.join(', ')})`);
    }
    lines.push('');
  }

  // Mitigations
  if (report.mitigations.length > 0) {
    lines.push('--- Recommended Mitigations ---');
    for (const m of report.mitigations) {
      lines.push(`  * ${m}`);
    }
    lines.push('');
  }

  lines.push('=== END REPORT ===');
  return lines.join('\n');
}
