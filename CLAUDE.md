# CLAUDE.md — Faultline

## Project Overview

Faultline is a forensic AI claim verification platform. It extracts atomic claims from AI-generated text, verifies them against live web data, and presents a risk scorecard.

**Origin**: Started as a Kaggle competition entry (tagged `kaggle-demo-v1`). Promoted to **Faultline Pro (P-08b)** 2026-03-03 by Asif. This branch IS the Pro codebase.
**NEXUS**: `.asif/NEXUS.md` (13 initiatives, 5 vision pillars)

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS
- `@google/genai` (Gemini 3 Pro) — extraction + verification
- Google Custom Search API — web grounding
- Express.js (optional backend proxy for API key security)
- Vitest (testing, minimal coverage)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm test             # Run Vitest
```

## Architecture

4-phase pipeline:
1. **Extract** — Gemini JSON schema decomposes text into atomic claims (type, importance, dependencies)
2. **Verify** — Per-claim verification via Google Search + LLM verdict engine
3. **Synthesize** — Risk scorecard (Low/Medium/High/Critical) with seismic barometer
4. **Refine** — Generate improved prompts that force rigor

## Key Files

- `services/geminiService.ts` — All LLM logic (extraction, verification, synthesis). Hardcoded to Gemini 3 Pro.
- `App.tsx` — Pipeline orchestration, state management, API key handling
- `components/Dashboard.tsx` — Risk scorecard + seismic barometer visualization
- `types.ts` — Claim, VerificationResult, AnalysisState types

## Important Notes

- This repo IS **Faultline Pro (P-08b)** — multi-provider (Gemini/OpenAI/Claude), full CLI, EU AI Act compliance
- The Kaggle-only version is preserved at tag `kaggle-demo-v1` (commit 6e05fcc)
- A mirror of this repo exists at `~/projects/Faultline-Pro/` (github.com/nxtg-ai/faultline-pro)
- `git stash@{0}` is a historical artefact — superseded by this branch. Do not act on it.

---

## CI Gate Protocol (ASIF Standard)
Before EVERY `git push`, you MUST:
1. Run the full test suite (`npm test`)
2. Verify ZERO failures (xfail/skip OK, failures NOT OK)
3. If tests fail → fix before pushing. No exceptions.
4. Include test count in commit message: "Tests: X passed, Y skipped"
Violating this protocol means broken CI, which means Asif gets spammed.

---

## ASIF Governance

This project is **P-08b (Faultline Pro)** in the ASIF portfolio (AI Trust & Safety vertical). It is governed by the ASIF Chief of Staff.

**On every session**:
1. Read `.asif/NEXUS.md` — check the `## CoS Directives` section at the bottom
2. Execute any **PENDING** directives before other work (unless Asif explicitly overrides)
3. Write your response inline under each directive's `**Response**` section
4. Update initiative statuses in NEXUS if your work changes them
5. If you have questions for the CoS, add them under `## Team Questions` in NEXUS

## Execution Strategy
For any directive that touches 3+ files or requires architectural decisions:
1. USE PLAN MODE — think before you code. Outline your approach first.
2. USE AGENT TEAMS — break complex work into parallel sub-tasks. You have sub-agents. Use them.
3. Test everything. Test counts never decrease.
Do NOT skip planning on complex directives. Plan mode and agent teams are your super-powers.

**Escalation via Team Questions**: When you hit a blocker, need an architecture review, or have a portfolio-level question, add it under `## Team Questions` in your `.asif/NEXUS.md`. Your CoS checks these 3x daily during scheduled enrichment cycles and will respond inline or issue follow-up directives.

**Note on stash**: `git stash@{0}` is a historical artefact from before the P-08b promotion. It has been superseded by this branch. No constraint on it — it will be dropped in a future cleanup.
