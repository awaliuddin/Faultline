import type { Claim, VerificationResult } from '../types';

export interface ImageInput {
  data: string;
  mimeType: string;
}

export interface CritiqueResult {
  critique: string;
  improvedPrompt: string;
}

/**
 * Base interface for LLM providers in the Faultline pipeline.
 *
 * Each provider must implement three capabilities:
 * 1. Extract atomic claims from text/image input
 * 2. Verify a single claim against external evidence
 * 3. Generate a critique and improved prompt from failed claims
 *
 * Providers are initialized with an API key and expose a `modelId`
 * for identification in logs and UI.
 */
export interface LLMProvider {
  readonly name: string;
  readonly modelId: string;

  extractClaims(text: string, image?: ImageInput): Promise<Claim[]>;
  verifyClaim(claim: Claim): Promise<VerificationResult>;
  generateCritiqueAndPrompt(originalText: string, failedClaims: Claim[]): Promise<CritiqueResult>;
}

/**
 * Factory function type for creating provider instances.
 * Each provider module should export a factory matching this signature.
 */
export type ProviderFactory = (apiKey: string) => LLMProvider;
