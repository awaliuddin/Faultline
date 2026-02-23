# Architecture

Faultline is a 5-stage pipeline that transforms AI-generated text into a compliance-assessed trust report.

## Pipeline Stages

### 1. Extraction

The LLM provider decomposes input text into atomic `Claim` objects:

```typescript
interface Claim {
  id: string;          // "c1", "c2", ...
  text: string;        // Standalone assertion
  type: ClaimType;     // "fact" | "opinion" | "interpretation"
  importance: number;  // 1-5 (5 = critical to argument)
}
```

The extraction prompt enforces JSON schema output. Claims are classified by type and scored by structural importance to the argument.

### 2. Filtering & Verification

Only **facts with importance >= 3** are verified (max 8 per analysis). This avoids wasting API calls on opinions or low-stakes trivia.

Each selected claim is verified against live web data. The Gemini provider uses Google Search grounding; the Claude provider relies on the model's knowledge. Verification produces:

```typescript
interface VerificationResult {
  claimId: string;
  status: "supported" | "contradicted" | "mixed" | "unverified";
  explanation: string;
  sources: Array<{ title: string; uri: string }>;
}
```

### 3. Risk Scoring

Aggregate verdicts determine the overall risk level:

| Condition | Risk Level |
|-----------|-----------|
| 3+ contradicted | Critical |
| 1+ contradicted OR 3+ mixed | High |
| 1+ mixed | Medium |
| All supported/unverified | Low |

### 4. EU AI Act Mapping

Each verified claim is mapped to an EU AI Act risk category:

| Tier | Trigger | Reference |
|------|---------|-----------|
| **Unacceptable** | Social scoring, mass surveillance, subliminal manipulation, exploitation of vulnerabilities, workplace emotion recognition | Article 5 |
| **High** | Biometrics, critical infrastructure, education, employment, credit scoring, law enforcement, migration, justice, elections | Article 6, Annex III |
| **Limited** | Contradicted or mixed claims (transparency obligation for AI-generated content) | Article 50 |
| **Minimal** | Supported or unverified generic claims | Recital 32 |

Pattern matching uses domain-specific regexes against claim text. Contradicted high-importance claims in high-risk domains receive elevated confidence scores.

### 5. Compliance Report

Aggregates all mappings into a structured report:

- Per-tier claim counts and highest tier
- Triggered EU AI Act articles with associated claim IDs
- Tier-appropriate mitigation recommendations

## Provider Abstraction

All LLM interaction goes through the `LLMProvider` interface:

```typescript
interface LLMProvider {
  readonly name: string;
  readonly modelId: string;
  extractClaims(text: string, image?: ImageInput): Promise<Claim[]>;
  verifyClaim(claim: Claim): Promise<VerificationResult>;
  generateCritiqueAndPrompt(text: string, claims: Claim[]): Promise<CritiqueResult>;
}
```

### Implementations

- **GeminiProvider** — Thin adapter over `services/geminiService.ts`. Uses `@google/genai` SDK with JSON schema enforcement and Google Search grounding.
- **ClaudeProvider** — Direct `fetch` calls to the Anthropic Messages API. No SDK dependency. Parses JSON from model responses with markdown-aware extraction.

### Registry

```typescript
import { getProvider } from './providers';

// Default: Gemini
const provider = getProvider('api-key');

// Explicit selection
const claude = getProvider('api-key', 'claude');

// Environment variable: FAULTLINE_PROVIDER=claude
const envProvider = getProvider('api-key');
```

New providers are added by:
1. Implementing `LLMProvider`
2. Exporting a `ProviderFactory` function
3. Registering in `providers/registry.ts`

## Data Flow

```
User Input (text/image)
       │
       ▼
  LLMProvider.extractClaims()
       │
       ▼
  Claim[] ──filter──▶ facts, importance ≥ 3, max 8
       │
       ▼
  LLMProvider.verifyClaim()  (per claim)
       │
       ▼
  VerificationResult[] ──aggregate──▶ Risk Level
       │
       ▼
  mapClaimToRiskCategory()  (per claim)
       │
       ▼
  generateComplianceReport()
       │
       ▼
  ComplianceReport { euRiskSummary, triggeredArticles, mitigations }
```

## Error Handling

Every stage fails gracefully:

| Stage | Failure Mode | Recovery |
|-------|-------------|----------|
| Extraction | API error, invalid JSON | Return `[]` (empty claims) |
| Verification | API error, parse failure | Return `status: "unverified"` |
| Critique | API error | Return fallback text |
| Risk Scoring | No verifications | Return `"low"` |
| Compliance | No claims | Report with "No verified claims" mitigation |

## Test Architecture

164 tests across 10 files:

- **Unit tests**: types, geminiService, app logic, provider implementations, compliance mapping
- **Integration tests**: full pipeline (extract → score → map → report), multi-provider shape validation
- **All API calls mocked** — tests run offline in ~600ms
