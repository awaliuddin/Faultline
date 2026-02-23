import type { Claim, VerificationResult, AnalysisState } from '../types';
import {
  type EURiskLevel,
  type ClaimRiskMapping,
  EU_RISK_CATEGORIES,
  mapClaimToRiskCategory,
} from './eu_ai_act';

export interface ComplianceReport {
  generatedAt: string;
  overallRiskLevel: AnalysisState['overallRisk'];
  euRiskSummary: EURiskSummary;
  claimMappings: ClaimRiskMapping[];
  triggeredArticles: TriggeredArticle[];
  mitigations: string[];
}

export interface EURiskSummary {
  unacceptable: number;
  high: number;
  limited: number;
  minimal: number;
  totalClaims: number;
  highestTier: EURiskLevel;
}

export interface TriggeredArticle {
  article: string;
  reason: string;
  claimIds: string[];
}

/**
 * Generate a compliance report from Faultline analysis results.
 *
 * Takes claims, their verification results, and the overall risk level,
 * then maps each claim to an EU AI Act risk category and aggregates
 * into a structured report.
 */
export function generateComplianceReport(
  claims: Claim[],
  verifications: Record<string, VerificationResult>,
  overallRisk: AnalysisState['overallRisk'],
): ComplianceReport {
  // Map each claim that has a verification result
  const claimMappings: ClaimRiskMapping[] = [];
  for (const claim of claims) {
    const verification = verifications[claim.id];
    if (!verification) continue;
    claimMappings.push(mapClaimToRiskCategory(claim, verification));
  }

  // Count per tier
  const summary: EURiskSummary = {
    unacceptable: 0,
    high: 0,
    limited: 0,
    minimal: 0,
    totalClaims: claimMappings.length,
    highestTier: 'minimal',
  };

  const tierPriority: EURiskLevel[] = ['unacceptable', 'high', 'limited', 'minimal'];

  for (const mapping of claimMappings) {
    summary[mapping.riskLevel]++;
  }

  // Determine highest tier
  for (const tier of tierPriority) {
    if (summary[tier] > 0) {
      summary.highestTier = tier;
      break;
    }
  }

  // Aggregate triggered articles
  const articleMap = new Map<string, { reason: string; claimIds: string[] }>();
  for (const mapping of claimMappings) {
    for (const pattern of mapping.matchedPatterns) {
      const existing = articleMap.get(pattern);
      if (existing) {
        existing.claimIds.push(mapping.claimId);
      } else {
        articleMap.set(pattern, {
          reason: `${EU_RISK_CATEGORIES[mapping.riskLevel].title}: ${mapping.claimText.substring(0, 80)}`,
          claimIds: [mapping.claimId],
        });
      }
    }
  }

  const triggeredArticles: TriggeredArticle[] = [];
  for (const [article, data] of articleMap) {
    triggeredArticles.push({ article, ...data });
  }

  // Generate mitigations based on highest tier
  const mitigations = generateMitigations(summary.highestTier, summary);

  return {
    generatedAt: new Date().toISOString(),
    overallRiskLevel: overallRisk,
    euRiskSummary: summary,
    claimMappings,
    triggeredArticles,
    mitigations,
  };
}

function generateMitigations(
  highestTier: EURiskLevel,
  summary: EURiskSummary,
): string[] {
  const mitigations: string[] = [];

  if (summary.unacceptable > 0) {
    mitigations.push(
      'CRITICAL: Content references prohibited AI practices. Do not deploy without legal review.',
    );
    mitigations.push(
      'Consult Article 5 of the EU AI Act for the full list of prohibited practices.',
    );
  }

  if (summary.high > 0) {
    mitigations.push(
      'High-risk domain detected. Ensure a risk management system is in place (Article 9).',
    );
    mitigations.push(
      'Maintain technical documentation and enable human oversight (Articles 11, 14).',
    );
  }

  if (summary.limited > 0) {
    mitigations.push(
      'Ensure AI-generated content is clearly labelled per Article 50 transparency obligations.',
    );
  }

  if (highestTier === 'minimal' && summary.totalClaims > 0) {
    mitigations.push(
      'All claims fall under minimal risk. Consider voluntary codes of conduct.',
    );
  }

  if (summary.totalClaims === 0) {
    mitigations.push('No verified claims to assess. Run verification first.');
  }

  return mitigations;
}
