# Faultline

**AI Trust & Safety Platform — Verify AI claims, assess risk, ensure EU AI Act compliance.**

[![CI](https://github.com/awaliuddin/Faultline/actions/workflows/ci.yml/badge.svg)](https://github.com/awaliuddin/Faultline/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-829%20passing-brightgreen)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-CC%20BY%204.0-green.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Kaggle](https://img.shields.io/badge/Kaggle-Competition%20Entry-20BEFF.svg)](https://www.kaggle.com/competitions/gemini-3/writeups/faultline-seismic-stress-testing-for-ai-hallucina)

Faultline decomposes AI-generated text into atomic claims, stress-tests each against live web data, scores risk, and maps findings to EU AI Act compliance categories. Built for the Gemini 3 Kaggle competition; architected for multi-provider expansion.

[Live Demo](https://ai.studio/apps/drive/1zAf8IZnRT6w8kXJ42aTT0DUNhYhacjmT) | [Video](https://youtu.be/9UTA2nIYmCM) | [Kaggle Writeup](https://www.kaggle.com/competitions/gemini-3/writeups/faultline-seismic-stress-testing-for-ai-hallucina) | [Architecture](docs/ARCHITECTURE.md)

---

## Quick Start

### Web App (React UI)

```bash
git clone https://github.com/awaliuddin/Faultline.git && cd Faultline
npm install
npm run dev        # opens browser UI at localhost:5173
```

### CLI

```bash
npm install
export GEMINI_API_KEY="your-key"   # or ANTHROPIC_API_KEY / OPENAI_API_KEY

npx tsx cli/index.ts scan --input document.txt --provider gemini
npx tsx cli/index.ts scan --input document.txt --provider claude --output-format markdown
npx tsx cli/index.ts scan --input document.txt --sarif              # writes results.sarif
npx tsx cli/index.ts weakest --input document.txt                   # weakest-link claim
npx tsx cli/index.ts graph --input document.txt --format mermaid    # claim graph
npx tsx cli/index.ts history                                         # past scan history
npx tsx cli/index.ts trend --file document.txt                      # finding trend
npx tsx cli/index.ts watch --dir ./src --provider mock              # watch mode
npx tsx cli/index.ts rules                                           # list detection rules
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
│  LLM Provider           │  Gemini, Claude, or OpenAI
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

- **Multi-provider architecture** — `LLMProvider` interface with Gemini, Claude (Anthropic), and OpenAI implementations. Add new providers by implementing 3 methods.
- **Claim forensics** — Atomic decomposition into fact/opinion/interpretation with importance scoring (1-5).
- **Web-grounded verification** — Google Search tool for live evidence. Verdicts: supported, contradicted, mixed, unverified.
- **EU AI Act compliance** — Risk category mapping per Articles 5-7 and Annex III. Prohibited practice detection, high-risk domain matching, transparency obligations.
- **Weakest-link detection** — Per-claim fragility scoring; identifies the claim that most undermines argument integrity.
- **Claim graph export** — Mermaid and Graphviz DOT visualizations grouping claims by EU risk tier.
- **SARIF output** — VS Code / GitHub Code Scanning integration with `relatedLocations`, `uriBaseId`, and `codeFlows`.
- **Scan history + trend analysis** — Local `.faultline/history/` store; `faultline trend` shows improving/degrading direction over time.
- **Watch mode** — `faultline watch --dir` re-scans on file save with 500ms debounce and new/resolved diff highlights.
- **YAML rule engine** — Custom compliance rules in YAML; built-in PII, bias, and security rule sets.
- **829 tests** — Unit, integration, and full pipeline tests across 27 files. All API calls mocked. CI via GitHub Actions.

---

## Project Structure

```
├── cli/
│   ├── index.ts                # CLI entry point (15+ commands)
│   ├── scan.ts                 # Core scan pipeline
│   ├── report.ts               # Multi-format output (JSON/Markdown/HTML/SARIF)
│   ├── watch.ts                # File-watch mode with debounce + diff
│   ├── weakest.ts              # Weakest-link formatter
│   └── aggregate.ts            # Multi-file report aggregation
├── analysis/
│   ├── weakest-link.ts         # Fragility scoring algorithm
│   └── claim-graph.ts          # Claim graph (Mermaid + DOT)
├── providers/
│   ├── base_provider.ts        # LLMProvider interface
│   ├── gemini_provider.ts      # Google Gemini adapter
│   ├── claude_provider.ts      # Anthropic Claude adapter
│   ├── openai_provider.ts      # OpenAI adapter
│   └── registry.ts             # Provider lookup (env-configurable)
├── compliance/
│   ├── eu_ai_act.ts            # EU AI Act risk categories (Articles 5-7, Annex III)
│   └── report_generator.ts     # Compliance report aggregation
├── rules/
│   ├── base_rule.ts            # Rule + Finding interfaces
│   ├── registry.ts             # Rule registry with YAML loader
│   └── yaml/                   # Built-in YAML rules (pii, bias, security)
├── history/
│   └── store.ts                # Scan history storage + trend analysis
├── templates/                  # Red-team prompt template library
├── services/geminiService.ts   # React app LLM logic (web UI only)
├── App.tsx                     # React pipeline orchestration + UI state
├── components/                 # Dashboard, charts, tour
├── types.ts                    # Claim, VerificationResult, AnalysisState
└── tests/                      # 829 tests across 27 files
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Gemini 3 Pro (`@google/genai`), Claude (Anthropic API), OpenAI (`gpt-4o`) |
| Grounding | Google Custom Search API |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| CLI | `tsx`, `js-yaml`, Node.js built-ins (no runtime deps) |
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

Started as a Kaggle competition entry ([Gemini 3 competition](https://www.kaggle.com/competitions/gemini-3)). The project has since grown into a full CLI tool and multi-provider platform supporting Gemini, Claude, and OpenAI.

---

Built by [NextGen AI](https://nxtg.ai) | Powered by [Google AI Studio](https://aistudio.google.com/)
