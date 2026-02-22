# NEXUS — Faultline Vision-to-Execution Dashboard

> **Owner**: Asif Waliuddin
> **Last Updated**: 2026-02-16
> **North Star**: Build a "trust layer" for AI-generated content — weaponize advanced reasoning to answer: "Can I trust this answer?" Expose the hidden fault lines in AI reasoning before they cause damage.

---

## Executive Dashboard

| ID | Initiative | Pillar | Status | Priority | Last Touched |
|----|-----------|--------|--------|----------|-------------|
| N-01 | Core Claim Extraction | FORENSIC | SHIPPED | P0 | 2026-01 |
| N-02 | Search-Grounded Verification | EVIDENCE | SHIPPED | P0 | 2026-01 |
| N-03 | Risk Scorecard Dashboard | VISUALIZATION | SHIPPED | P0 | 2026-01 |
| N-04 | Performance Modes | EVIDENCE | SHIPPED | P1 | 2026-01 |
| N-05 | Turbo Batching | EVIDENCE | SHIPPED | P2 | 2026-01 |
| N-06 | Backend API Key Proxy | EVIDENCE | SHIPPED | P1 | 2026-01 |
| N-07 | Live Demo & UI Polish | VISUALIZATION | SHIPPED | P1 | 2026-01 |
| N-08 | Test Coverage Expansion | — | BUILDING | P0 | 2026-02 |
| N-09 | CI/CD Pipeline | — | BUILDING | P0 | 2026-02 |
| N-10 | Claim Graph Visualization | FORENSIC | IDEA | P1 | — |
| N-11 | Multimodal Upload (PDF/OCR) | MULTIMODAL | IDEA | P1 | — |
| N-12 | Weakest-Link Detection | FORENSIC | IDEA | P1 | — |

---

## Vision Pillars

### FORENSIC — "Inference Autopsy"
- Decompose dense text into atomic claim-graph representations
- Classify by type (fact/opinion/interpretation) and importance
- Score logical fragility and find weakest reasoning chains
- **Shipped**: N-01
- **Ideas**: N-10, N-12

### EVIDENCE — "Web-Grounded Verification"
- Verify factual claims against live web data using search + LLM
- Sourced verdicts: supported / contradicted / mixed / unverified
- Performance modes (Fast/Balanced/Full), turbo batching
- **Shipped**: N-02, N-04, N-05, N-06

### VISUALIZATION — "Trust Dashboard"
- Color-coded risk scorecard (Low/Medium/High/Critical)
- Seismic Barometer visualization, dynamic charts
- Guided tour and informational sections
- **Shipped**: N-03, N-07

### SYNTHESIS — "Ask Better Next Time"
- Generate improved prompts that force rigor and transparency
- Optional answer rewrites with sourced citations
- Critique generation highlighting reasoning gaps

### MULTIMODAL — "Beyond Text"
- Accept screenshots, PDFs, and other inputs
- OCR extraction as entry point to claims pipeline
- **Ideas**: N-11

---

## Initiative Details

### N-01: Core Claim Extraction
**Pillar**: FORENSIC | **Status**: SHIPPED | **Priority**: P0
**What**: Gemini 3 Pro JSON schema for atomic claim decomposition with type/importance scoring and dependency graph.

### N-02: Search-Grounded Verification
**Pillar**: EVIDENCE | **Status**: SHIPPED | **Priority**: P0
**What**: Per-claim verification pipeline using Google Custom Search + LLM verdict engine.

### N-03: Risk Scorecard Dashboard
**Pillar**: VISUALIZATION | **Status**: SHIPPED | **Priority**: P0
**What**: Color-coded UI showing supported/contradicted/mixed/unverified counts; overall risk level.

### N-04: Performance Modes
**Pillar**: EVIDENCE | **Status**: SHIPPED | **Priority**: P1
**What**: Fast/Balanced/Full modes. Tunable max verifications, concurrency, retries, timeouts.

### N-05: Turbo Batching
**Pillar**: EVIDENCE | **Status**: SHIPPED | **Priority**: P2
**What**: Batch multiple claims into single LLM call for speed. Graceful fallback to per-claim.

### N-06: Backend API Key Proxy
**Pillar**: EVIDENCE | **Status**: SHIPPED | **Priority**: P1
**What**: Express server keeps API keys server-side. Removes browser key exposure.

### N-07: Live Demo & UI Polish
**Pillar**: VISUALIZATION | **Status**: SHIPPED | **Priority**: P1
**What**: Seismic Barometer, dynamic charts, guided tour.

### N-08: Test Coverage Expansion
**Status**: BUILDING | **Priority**: P0
**What**: Build unit/integration tests for the pipeline. Target full pipeline coverage.
**Baseline (2026-02-18)**: Zero tests exist. Vitest not installed. No test script in package.json.
**Next step**: Install Vitest, add test script, write first unit tests for geminiService.ts.

### N-09: CI/CD Pipeline
**Status**: BUILDING | **Priority**: P0
**What**: GitHub Actions for lint, test, build on PR/push to main.
**Next step**: Create workflow YAML, wire to test suite.

### N-10: Claim Graph Visualization
**Pillar**: FORENSIC | **Status**: IDEA | **Priority**: P1
**What**: Network/DAG visualization showing dependency graph of claims. Highlight critical reasoning paths.

### N-11: Multimodal Upload (PDF/OCR)
**Pillar**: MULTIMODAL | **Status**: IDEA | **Priority**: P1
**What**: Image/PDF OCR extraction as entry point to claims pipeline.

### N-12: Weakest-Link Detection
**Pillar**: FORENSIC | **Status**: IDEA | **Priority**: P1
**What**: Automatic identification of most fragile reasoning chains; visual highlighting in UI.

---

## Tech Stack

- Google Gemini 3 Pro (claim extraction + verification)
- Google Custom Search API (web grounding)
- React 19, TypeScript, Tailwind CSS, Vite
- Express.js (optional backend proxy)
- Vitest (testing, minimal coverage currently)

---

## Status Lifecycle

```
IDEA ──> RESEARCHED ──> DECIDED ──> BUILDING ──> SHIPPED
  │          │              │           │
  └──────────┴──────────────┴───────────┴──> ARCHIVED
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-16 | Created. 12 initiatives across 5 pillars. 7 shipped, 2 building, 3 ideas. |

---

## CoS Directives

### DIRECTIVE-NXTG-20260222-01 — Bootstrap Test Suite + CI (N-08/N-09)
**From**: NXTG-AI CoS | **Priority**: P1
**Injected**: 2026-02-22 04:35 | **Estimate**: S | **Status**: PENDING

> **Estimate key**: S = hours (same session), M = 1-2 days, L = 3+ days

**Context**: Faultline has 0 tests and no CI. DIRECTIVE-20260220-01 (CI compliance) is PENDING because there was no session to execute it. This directive combines both: create tests AND CI in one shot. This is the last project with zero test infrastructure.

**Action Items**:
1. [ ] Install Vitest: `npm install -D vitest @vitest/coverage-v8`. Add `"test": "vitest run"` to package.json.
2. [ ] Write 10 smoke tests covering: geminiService module loads, claim extraction parses sample text, verification pipeline accepts claims, risk scorecard computes levels, performance mode selection works. Use mocked Gemini responses (no real API calls in tests).
3. [ ] Create `.github/workflows/ci.yml`: checkout → setup Node → npm ci → npm test. Use actions/checkout@v4, actions/setup-node@v4. Trigger on push/PR to main.
4. [ ] Move N-08 from BUILDING → SHIPPED and N-09 from BUILDING → SHIPPED once tests pass in CI.
5. [ ] Report: test count, CI workflow status (note: won't run until pushed to GitHub).

**Constraints**:
- Do NOT add non-Google SDK deps (Kaggle entry, Google-only)
- Do NOT touch `git stash@{0}` (FM-agnostic version for P-08b)
- Mock all Gemini API calls in tests — no real API usage in CI

**Response** (filled by project team):
>

---

### DIRECTIVE-NXTG-20260216-01 — Baseline Audit
**From**: NXTG-AI CoS | **Date**: 2026-02-16 | **Status**: DONE
**Priority**: P0

**Action Items**:
1. [ ] Run `npm test` and report pass/fail counts. Update N-08 with actual test baseline.
2. [ ] Confirm the Google-locked files are ONLY: `services/geminiService.ts`, `App.tsx` (lines 10-17, 67-72), `components/Tour.tsx` (line 63), `components/featureData.tsx`, `components/InputSection.tsx` (line 201). If others exist, list them here.
3. [ ] If N-09 (CI/CD) work is done, update its status from BUILDING to SHIPPED.

**Constraints**:
- Do NOT touch `git stash@{0}`. It contains the FM-agnostic version (future P-08b). Do not pop, apply, or drop.
- Do NOT add OpenAI/Anthropic SDK dependencies. This repo stays Google-only (Kaggle entry).

**Escalation** (for Asif only):
- Naming + timing for the Faultline Pro repo split
- Whether this repo freezes after CI/CD or continues receiving features

**Response** (filled by project team):
> **Completed 2026-02-18 by Claude (Opus 4.6)**
>
> **1. Test baseline**: No test infrastructure exists. `package.json` has no `test` script, Vitest is not installed as a dependency, and zero test files (`*.test.ts/tsx`) exist in the repo. N-08 baseline: **0 tests, 0 passing, 0% coverage**.
>
> **2. Google-locked files confirmed + correction**:
> - `services/geminiService.ts` — SDK import + all LLM calls (lines 2, 40–43, 49, 106, 191)
> - `App.tsx` — geminiService import (line 4), Gemini branding (lines 233, 262)
> - `components/Tour.tsx` — Gemini mention (line 63)
> - `components/featureData.tsx` — Gemini branding throughout (lines 14, 21, 28, 52, 79, 86, 88)
> - `components/InputSection.tsx` — Gemini mention (line 201)
> - **`vite.config.ts`** — `GEMINI_API_KEY` env var injection (lines 14–15) — **missing from directive's list**
>
> Note: `App.tsx` line ranges differ from directive (4, 233, 262 vs 10–17, 67–72); file may have been edited since directive was written.
>
> **3. N-09 (CI/CD)**: NOT shipped. No `.github/workflows/` directory exists. Status remains BUILDING.

---

### DIRECTIVE-NXTG-20260220-01 — CI/CD Compliance (ADR-008)
**From**: NXTG-AI CoS | **Date**: 2026-02-20 | **Status**: PENDING
**Priority**: P1

**Context**: ADR-008 (CI/CD Health Monitoring Protocol) has been accepted as a portfolio-wide standard. Every project MUST have a GitHub Actions CI workflow with a test gate. You currently have NO CI workflow AND no test infrastructure (0 tests). This directive requires both.

**Action Items**:
1. [ ] **Create a minimal test suite**. At minimum: 1 test file that imports the main modules and verifies they load without errors. Use Vitest (portfolio standard for React/TS projects). Target: at least 5 smoke tests.
2. [ ] **Create `.github/workflows/ci.yml`** with a test gate: checkout → setup Node → `npm ci` → `npm test`. Workflow MUST fail if tests fail.
3. [ ] Workflow MUST trigger on `push` to `main` and `pull_request` to `main`.
4. [ ] Use `actions/checkout@v4` and `actions/setup-node@v4`.
5. [ ] **Report**: Confirm test count and green workflow run URL.

**Constraints**:
- Do NOT add non-Google SDK dependencies (this is a Kaggle entry, Google-only).
- Do NOT touch `git stash@{0}` (FM-agnostic version for P-08b).
- Start with smoke tests, not full coverage — the goal is a CI gate, not 80% coverage today.

**Reference**: `~/ASIF/decisions/ADR-008-cicd-health-monitoring.md`

**Response** (filled by project team):
>

---

## Portfolio Intelligence

_Cross-project insights injected by ASIF CoS. Read these for awareness — they inform your priorities._

### PI-001: Faultline Pro Has the Portfolio's Only Provider Abstraction (2026-02-17)
Faultline Pro (stashed FM-agnostic version) contains a provider dispatcher supporting Google, OpenAI, Anthropic, and local models. No other project in the portfolio has a generalized LLM provider abstraction. DesktopAI has OllamaClient (single provider), but Faultline Pro's multi-provider dispatch is unique. When the split happens, this pattern could inform a portfolio-wide LLM abstraction layer.

---

## Team Questions

_(Project team: add questions for ASIF CoS here. They will be answered during the next enrichment cycle.)_
