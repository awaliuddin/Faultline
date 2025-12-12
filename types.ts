
export type ClaimType = 'fact' | 'opinion' | 'interpretation';

export type ClaimStatus = 'supported' | 'contradicted' | 'mixed' | 'unverified' | 'loading' | 'skipped';

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  importance: number; // 1 to 5
}

export interface VerificationResult {
  claimId: string;
  status: ClaimStatus;
  explanation: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface AnalysisState {
  claims: Claim[];
  verifications: Record<string, VerificationResult>;
  isProcessing: boolean;
  progressMessage: string;
  step: 'idle' | 'extracting' | 'verifying' | 'complete';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  critique?: string;
  improvedPrompt?: string;
}
