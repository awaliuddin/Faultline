# Faultline

**AI Trust & Safety Platform — Verify AI claims, assess risk, ensure EU AI Act compliance.**

[![CI](https://github.com/awaliuddin/Faultline/actions/workflows/ci.yml/badge.svg)](https://github.com/awaliuddin/Faultline/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-547%20passing-brightgreen)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-CC%20BY%204.0-green.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Kaggle](https://img.shields.io/badge/Kaggle-Competition%20Entry-20BEFF.svg)](https://www.kaggle.com/competitions/gemini-3/writeups/faultline-seismic-stress-testing-for-ai-hallucina)

Faultline decomposes AI-generated text into atomic claims, stress-tests each against live web data, scores risk, and maps findings to EU AI Act compliance categories. Built for the Gemini 3 Kaggle competition; architected for multi-provider expansion.

[Live Demo](https://ai.studio/apps/drive/1zAf8IZnRT6w8kXJ42aTT0DUNhYhacjmT) | [Video](https://youtu.be/9UTA2nIYmCM) | [Kaggle Writeup](https://www.kaggle.com/competitions/gemini-3/writeups/faultline-seismic-stress-testing-for-ai-hallucina) | [Architecture](docs/ARCHITECTURE.md)

---

## Quick Start

```bash
git clone https://github.com/awaliuddin/Faultline.git && cd Faultline
npm install
npm run dev
```

Set your API key in the browser UI or via environment variable:

```bash
export GEMINI_API_KEY="your-key"
```

Run tests:

```bash
npm test
```

---

## How It Works

```
Input Text
  │
  ▼
┌─────────────────────────┐
│  LLM Provider           │  Gemini (default) or Claude
│  extractClaims()        │  → Claim[] (id, text, type, importance)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Filter & Verify        │  Facts with importance ≥ 3, max 8
│  verifyClaim()          │  → VerificationResult (status, sources)
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Risk Scoring           │  Low / Medium / High / Critical
│  (contradictions count) │  based on verification outcomes
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  EU AI Act Mapping      │  Unacceptable / High / Limited / Minimal
│  mapClaimToRiskCategory │  Article 5, Annex III pattern matching
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Compliance Report      │  Triggered articles, mitigations,
│  generateComplianceReport│  per-tier summary
└─────────────────────────┘
```

---

## Features

- **Multi-provider architecture** — `LLMProvider` interface with Gemini and Claude implementations. Add new providers by implementing 3 methods.
- **Claim forensics** — Atomic decomposition into fact/opinion/interpretation with importance scoring (1-5).
- **Web-grounded verification** — Google Search tool for live evidence. Verdicts: supported, contradicted, mixed, unverified.
- **EU AI Act compliance** — Risk category mapping per Articles 5-7 and Annex III. Prohibited practice detection, high-risk domain matching, transparency obligations.
- **Compliance reports** — Triggered articles, per-tier counts, recommended mitigations.
- **164 tests** — Unit, integration, and full pipeline tests. All API calls mocked. CI via GitHub Actions.

---

## Project Structure

```
├── services/geminiService.ts   # Core LLM logic (extraction, verification, critique)
├── providers/
│   ├── base_provider.ts        # LLMProvider interface
│   ├── gemini_provider.ts      # Google Gemini adapter
│   ├── claude_provider.ts      # Anthropic Claude adapter
│   └── registry.ts             # Provider lookup (env-configurable)
├── compliance/
│   ├── eu_ai_act.ts            # Risk categories + claim-to-tier mapping
│   └── report_generator.ts     # Compliance report aggregation
├── App.tsx                     # Pipeline orchestration + UI state
├── components/                 # Dashboard, charts, tour
├── types.ts                    # Claim, VerificationResult, AnalysisState
└── tests/                      # 164 tests across 10 files
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Gemini 3 Pro (`@google/genai`), Claude (Anthropic Messages API) |
| Grounding | Google Custom Search API |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Express.js (optional API key proxy) |
| Testing | Vitest, jsdom, @testing-library/react |
| CI | GitHub Actions (Node 20) |

---

## Provider Configuration

Default provider is Gemini. Switch via environment variable:

```bash
export FAULTLINE_PROVIDER=claude
```

Or programmatically:

```typescript
import { getProvider } from './providers';
const provider = getProvider('your-api-key', 'claude');
```

---

## Origin

Kaggle competition entry ([Gemini 3 competition](https://www.kaggle.com/competitions/gemini-3)). An FM-agnostic version with extended provider support exists as a separate project (Faultline Pro).

---

Built by [NextGen AI](https://nxtg.ai) | Powered by [Google AI Studio](https://aistudio.google.com/)
