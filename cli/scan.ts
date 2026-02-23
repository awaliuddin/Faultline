import type { Claim, VerificationResult, AnalysisState } from '../types.js';
import type { LLMProvider } from '../providers/base_provider.js';
import { getProvider, registerProvider } from '../providers/registry.js';
import { generateComplianceReport, type ComplianceReport } from '../compliance/report_generator.js';

export interface ScanResult {
  input: string;
  provider: string;
  claims: Claim[];
  verifications: Record<string, VerificationResult>;
  overallRisk: AnalysisState['overallRisk'];
  complianceReport: ComplianceReport;
}

function calculateRisk(
  verifications: Record<string, VerificationResult>,
): AnalysisState['overallRisk'] {
  const values = Object.values(verifications);
  const contradicted = values.filter((v) => v.status === 'contradicted').length;
  const mixed = values.filter((v) => v.status === 'mixed').length;
  if (contradicted > 2) return 'critical';
  if (contradicted > 0 || mixed > 2) return 'high';
  if (mixed > 0) return 'medium';
  return 'low';
}

function filterClaimsForVerification(claims: Claim[]): Claim[] {
  return claims
    .filter((c) => c.type === 'fact' && c.importance >= 3)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);
}

/**
 * Create a deterministic mock provider for offline testing.
 */
function createMockProvider(): LLMProvider {
  return {
    name: 'Mock Provider',
    modelId: 'mock-v1',

    async extractClaims(text: string): Promise<Claim[]> {
      if (!text) return [];
      // Split sentences into claims
      const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
      return sentences.map((s, i) => ({
        id: `c${i + 1}`,
        text: s,
        type: 'fact' as const,
        importance: Math.min(5, 3 + Math.floor(i / 2)),
      }));
    },

    async verifyClaim(claim: Claim) {
      return {
        claimId: claim.id,
        status: 'supported' as const,
        explanation: 'Mock verification: supported.',
        sources: [],
      };
    },

    async generateCritiqueAndPrompt() {
      return {
        critique: 'Mock assessment: stable.',
        improvedPrompt: 'No changes needed.',
      };
    },
  };
}

export async function scan(text: string, providerName?: string): Promise<ScanResult> {
  let provider: LLMProvider;

  if (providerName === 'mock') {
    provider = createMockProvider();
  } else {
    const apiKey =
      providerName === 'claude'
        ? process.env.ANTHROPIC_API_KEY || ''
        : process.env.GEMINI_API_KEY || '';

    if (!apiKey && providerName !== 'mock') {
      throw new Error(
        `No API key found. Set ${providerName === 'claude' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY'} or use --provider mock.`,
      );
    }

    provider = getProvider(apiKey, providerName);
  }

  const claims = await provider.extractClaims(text);
  const toVerify = filterClaimsForVerification(claims);

  const verifications: Record<string, VerificationResult> = {};
  for (const claim of toVerify) {
    verifications[claim.id] = await provider.verifyClaim(claim);
  }

  const overallRisk = calculateRisk(verifications);
  const complianceReport = generateComplianceReport(toVerify, verifications, overallRisk);

  return {
    input: text.substring(0, 200),
    provider: provider.name,
    claims,
    verifications,
    overallRisk,
    complianceReport,
  };
}
