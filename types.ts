
export type ClaimType = 'fact' | 'opinion' | 'interpretation';

export type ClaimStatus = 'supported' | 'contradicted' | 'mixed' | 'unverified' | 'loading';

export type ModelProvider = 'google' | 'openai' | 'anthropic' | 'local';

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  importance: number; // 1 to 5
  dependsOn?: string[];
}

export interface SourceEvidence {
  title: string;
  uri: string;
  snippet?: string;
}

export interface VerificationResult {
  claimId: string;
  status: ClaimStatus;
  explanation: string;
  sources: SourceEvidence[];
}

export interface AnalysisState {
  claims: Claim[];
  verifications: Record<string, VerificationResult>;
  isProcessing: boolean;
  isBackgroundVerifying?: boolean;
  progressMessage: string;
  step: 'idle' | 'extracting' | 'verifying' | 'verifying_rest' | 'complete';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  critique?: string;
  improvedPrompt?: string;
}
