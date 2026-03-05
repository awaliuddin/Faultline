# NEXUS — Faultline Vision-to-Execution Dashboard

> **Owner**: Asif Waliuddin
> **Last Updated**: 2026-03-04
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
| N-08 | Test Coverage Expansion | — | SHIPPED | P0 | 2026-02 |
| N-09 | CI/CD Pipeline | — | SHIPPED | P0 | 2026-02 |
| N-10 | Claim Graph Visualization | FORENSIC | SHIPPED | P1 | 2026-02 |
| N-11 | Multimodal Upload (PDF/OCR) | MULTIMODAL | SHIPPED | P1 | 2026-03-04 |
| N-12 | Weakest-Link Detection | FORENSIC | SHIPPED | P1 | 2026-02 |
| N-13 | Critique + Improved Prompt | SYNTHESIS | SHIPPED | P1 | 2026-02 |

---

## Vision Pillars

### FORENSIC — "Inference Autopsy"
- Decompose dense text into atomic claim-graph representations
- Classify by type (fact/opinion/interpretation) and importance
- Score logical fragility and find weakest reasoning chains
- **Shipped**: N-01, N-10, N-12

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
- **Shipped**: N-13

### MULTIMODAL — "Beyond Text"
- Accept screenshots, PDFs, and other inputs
- OCR extraction as entry point to claims pipeline
- **Shipped**: N-11

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
**Status**: SHIPPED | **Priority**: P0
**What**: Build unit/integration tests for the pipeline. Target full pipeline coverage.
**Baseline (2026-02-18)**: Zero tests exist. Vitest not installed. No test script in package.json.
**Shipped (2026-02-22)**: 95 tests across 5 test files. Vitest + jsdom + @testing-library/react. All Gemini API calls mocked. Coverage: types.ts, geminiService.ts, App.tsx business logic, provider abstraction layer, integration pipeline tests.

### N-09: CI/CD Pipeline
**Status**: SHIPPED | **Priority**: P0
**What**: GitHub Actions for lint, test, build on PR/push to main.
**Shipped (2026-02-22)**: `.github/workflows/ci.yml` — checkout@v4, setup-node@v4 (Node 20), npm ci, npm test, npm run build. Triggers on push to main and PRs to main.

### N-10: Claim Graph Visualization
**Pillar**: FORENSIC | **Status**: SHIPPED | **Priority**: P1
**What**: Network/DAG visualization showing dependency graph of claims. Delivered via EU risk tier grouping as proxy for dependency graph (true claim dependency deferred to P-08b per TQ-003).

### N-11: Multimodal Upload (PDF/OCR)
**Pillar**: MULTIMODAL | **Status**: SHIPPED | **Priority**: P1
**What**: PDF and image (PNG/JPG/WEBP/GIF) input support via Gemini native multimodal. Binary file detection in CLI (`multimodal/extractor.ts`); `scan()` signature extended with `image?: ImageInput`; UI file picker extended to `accept="image/*,application/pdf"`. 18 new tests. 886 total (TQ-003 subsequently raised to 893).
**Shipped**: 2026-03-04

### N-12: Weakest-Link Detection
**Pillar**: FORENSIC | **Status**: SHIPPED | **Priority**: P1
**What**: Automatic identification of most fragile reasoning chains; `faultline weakest` CLI command with risk-tier ordering and fragility scoring.

### N-13: Critique + Improved Prompt
**Pillar**: SYNTHESIS | **Status**: SHIPPED | **Priority**: P1
**What**: `faultline critique` CLI command — full pipeline + critique of reasoning gaps + improved prompt that forces more rigorous claims. All three providers support `generateCritiqueAndPrompt`.

---

## Tech Stack

- Google Gemini 3 Pro (claim extraction + verification)
- Google Custom Search API (web grounding)
- React 19, TypeScript, Tailwind CSS, Vite
- Express.js (optional backend proxy)
- Vitest (testing, 893 tests, 29 files, jsdom + @testing-library/react)

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
| 2026-03-04 | TQ-003 DONE: Claim dependency graph. `dependencies?: string[]` on `Claim`. Schema + prompts updated (Gemini/Claude/OpenAI). `ClaimEdge` + `edges` in `ClaimGraph`. `renderMermaid`/`renderDot` emit real edges. 7 new tests → 893 total. |
| 2026-03-04 | N-11 SHIPPED: Multimodal PDF/image input. `multimodal/extractor.ts` (type detection + base64). `scan()` extended with `image?: ImageInput`. CLI binary file support. UI accept="image/*,application/pdf". 18 new tests → 886 total (29 files). All 5 NEXUS pillars now SHIPPED. |
| 2026-03-04 | Second-order CoS response analysis: TQ-003 defer condition met (now P-08b), TQ-004 blocker resolved (split done), TQ-006 added (N-11 Multimodal go/no-go). Team follow-ups written on TQ-003 and TQ-004. |
| 2026-03-04 | TQ-001 RESOLVED: CLAUDE.md updated — stale Kaggle framing removed, P-08b promotion acknowledged, stash constraint lifted. NEXUS Last Updated + Tech Stack + TQ-001 status corrected. |
| 2026-03-04 | DIRECTIVE-NXTG-20260304-07 DONE: CI Gate Protocol added to CLAUDE.md, pre-push hook installed, faultline-ci.yml fixed (security-events: write + continue-on-error on example scans). 868 tests (28 files). TQ-001 RESOLVED — P-08b split done per Emma/CLX9. |
| 2026-02-28 | DIRECTIVE-NXTG-20260228-02 DONE: Initiative Details reconciled (N-10, N-12 IDEA→SHIPPED; N-13 added). 868 tests verified (28 files). |
| 2026-02-28 | Archived 36 completed CoS directives to NEXUS-archive.md. NEXUS.md reduced from 1650 to 284 lines. |
| 2026-02-28 | CoS BUILD beat: 868 tests verified (28 files). Stash merge artifacts cleaned. All directives COMPLETED. Awaiting Asif decisions on P-08b split (TQ-001) and npm publish (TQ-004). |
| 2026-02-23 | Report aggregation: multi-file summary, risk heatmap, 4 output formats, faultline aggregate CLI. 547 tests, 22 files. |
| 2026-02-23 | Confidence score calibration: per-provider normalization to 0-100, linear/logarithmic curves, profile registry. 505 tests, 21 files. |
| 2026-02-23 | Multi-provider abstraction: formalized MockProvider, eliminated scan.ts special-case, mock registered in registry. 473 tests, 20 files. |
| 2026-02-23 | Severity-based exit codes (--fail-on flag) for CI pipeline integration. 453 tests, 19 files. |
| 2026-02-23 | GitHub Action for CI/CD integration (composite action, threshold gate, SARIF upload, example workflow). 445 tests, 19 files. |
| 2026-02-23 | Red-team prompt template library (15 templates, 5 categories), templates list/scan commands. 415 tests, 18 files. |
| 2026-02-23 | VS Code extension scaffold: scan-on-save, SARIF→diagnostics, config loading, 2 commands. 386 tests, 17 files. |
| 2026-02-23 | SARIF 2.1.0 output format (--output-format sarif) with tool info, rule definitions, results with locations/severity/confidence. 358 tests, 16 files. |
| 2026-02-23 | npm package prep: @nxtg-ai/faultline, bin entry, files array, npm pack validated (24 files, 24.7kB). 338 tests, 16 files. |
| 2026-02-23 | Watch mode (--dir) with 5s debounce, incremental file scanning, processFileChange/Debouncer. Tests expanded to 338 across 16 files. |
| 2026-02-23 | Configuration system (.faultlinerc.json) with directory walking, flag precedence, init command. Tests expanded to 318 across 15 files. |
| 2026-02-22 | CI pipeline enhanced with typecheck gate, fixed type errors, README badge updated to 299 tests. |
| 2026-02-22 | Plugin system for custom rules (PII, bias, toxicity), rule registry with auto-discovery, --rules CLI flag. Tests expanded to 299 across 14 files. |
| 2026-02-22 | Batch scanning + directory mode (--dir, --glob), recursive file collection, aggregated summary reports. Tests expanded to 258 across 13 files. |
| 2026-02-22 | Report export formats (JSON/Markdown/HTML) with --output-format flag, XSS-safe HTML, emoji risk badges. Tests expanded to 246 across 13 files. |
| 2026-02-22 | Confidence scoring (0.0-1.0) + --min-confidence threshold + confidence distribution in reports. Tests expanded to 218 across 13 files. |
| 2026-02-22 | CLI entry point (scan/report/version) + quickstart example. Tests expanded to 192 across 12 files. |
| 2026-02-22 | Multi-provider pipeline integration tests (Gemini/Claude/mock OpenAI). Tests expanded to 176 across 11 files. |
| 2026-02-22 | Public README rewrite + docs/ARCHITECTURE.md. |
| 2026-02-22 | Full pipeline + multi-provider integration tests. Tests expanded to 164 across 10 files. |
| 2026-02-22 | EU AI Act compliance module (risk mapping + report generator). Tests expanded to 151 across 8 files. |
| 2026-02-22 | Claude provider + provider registry added. Tests expanded to 123 across 7 files. |
| 2026-02-22 | Provider abstraction layer added (LLMProvider interface + GeminiProvider). Tests expanded to 95. |
| 2026-02-22 | N-08 SHIPPED (73 tests), N-09 SHIPPED (CI workflow). 9 shipped, 0 building, 3 ideas. |
| 2026-02-16 | Created. 12 initiatives across 5 pillars. 7 shipped, 2 building, 3 ideas. |

---

## CoS Directives

> 38 completed directives archived to NEXUS-archive.md (2026-03-04)

_No active directives._

---

## Portfolio Intelligence

_Cross-project insights injected by ASIF CoS. Read these for awareness — they inform your priorities._

### PI-001: Faultline Pro Has the Portfolio's Only Provider Abstraction (2026-02-17)
Faultline Pro (stashed FM-agnostic version) contains a provider dispatcher supporting Google, OpenAI, Anthropic, and local models. No other project in the portfolio has a generalized LLM provider abstraction. DesktopAI has OllamaClient (single provider), but Faultline Pro's multi-provider dispatch is unique. When the split happens, this pattern could inform a portfolio-wide LLM abstraction layer.

---

### PI-002 — Stream B Market Intelligence (2026-02-22)
**Source**: NXTG-AI CoS Enrichment Cycle | **Confidence**: HIGH

**Market Position**: AI Trust & Safety is EXPLOSIVE — deepfake detection $15.7B (42% CAGR), content moderation $13B, AI governance $1.2B. Deepfake cases surged 900% (500K → 8M) in 2023-2025. EU AI Act full enforcement August 2026 — only 18% of enterprises have governance frameworks. This is the highest-upside emerging opportunity in the portfolio.

**Competitive Landscape**: Reality Defender ($40M), Sensity AI (95-98% accuracy), Promptfoo (30K+ devs, open-source red-teaming). Key insight: position in evaluation/red-teaming niche, NOT deepfake detection (too well-funded).

**BLOCKER**: 0 tests on a safety tool DESTROYS credibility. This is the single highest-priority technical debt in the portfolio. Your current directive (test bootstrap) is the critical path.

**Cross-Project Synergy**: Forge + Faultline = "Build + Validate" loop — unique in market. No competitor has this. Forge orchestrates AI coding agents → Faultline validates output. Position as: "Generate with confidence, verify before ship."

**Strategic Path**: P-08b (FM-agnostic rewrite) is where the opportunity is. Current Kaggle codebase → test foundation → P-08b split → EU AI Act compliance mapping → open-source core with enterprise features (study Promptfoo's GTM).

## Team Feedback

### Reflection — 2026-03-05

**1. What did we ship since last check-in?**

**TQ-003: Claim Dependency Graph** — the last meaningful schema gap in the platform.

Deliverables (commit `1ab147f`):
- `types.ts` — `dependencies?: string[]` added to `Claim` interface; 5-line placeholder comment removed
- `services/geminiService.ts` — `dependencies` array added to responseSchema + extraction prompt updated
- `providers/claude_provider.ts` — `dependencies` field description added to extraction prompt
- `providers/openai_provider.ts` — same
- `providers/mock_provider.ts` — forward-chain generation: claim `c_i` depends on `c_{i-1}` (i > 0)
- `analysis/claim-graph.ts` — `ClaimEdge` type, `edges: ClaimEdge[]` on `ClaimGraph`, edge resolution in `buildClaimGraph`, `-->` lines in `renderMermaid`, `->` lines in `renderDot`
- `tests/claim-graph.test.ts` — 6 new edge tests (empty edges, single edge, direction correctness, missing dep silently skipped, Mermaid output, DOT output)
- `tests/weakest-link.test.ts` — 1 non-regression test confirming `analyzeWeakestLinks` ignores `dependencies`

**Test count: 886 → 893 (+7). 29 files. All pass. Build clean.**

Also: TQ-007 root cause identified and resolved by Wolf (CoS). The `has_pending_directive()` enrichment function was pattern-matching "PENDING"/"WAITING ON ASIF" in team reflection prose — triggering 5 false-positive enrichment cycles. Fix deployed on CoS side (`cos-blocker-audit.sh`). Four stale blocker refs cleaned from NEXUS by Asif in commit `d841736`.

---

**2. What surprised us?**

**Edge direction is more subtle than it looks.** The plan specified `fromNodeId → toNodeId` as "dependency → dependent" (i.e., the arrow points *toward* the claim that needs the dependency to hold). This is semantically correct but counterintuitive if you read it as a flow diagram — visually, the arrow looks like it flows *from* the thing you need *to* the thing that depends on it. Mermaid renders it exactly that way. This is correct for a prerequisite graph (DAG-style), but worth documenting for any future consumer of `ClaimEdge`.

**The nodeId-to-claimId mapping is sorting-order sensitive.** `buildClaimGraph` assigns `nodeId = 'c' + index` during `claims.map()` (pre-sort), then sorts nodes by tier severity. The edge-resolution code (`claimIdToNodeId`) is built from the post-map, pre-sort nodes — which is correct, since `nodeId` is fixed at map time. But if someone refactors the order of operations (e.g., sort before map), the mapping would break silently. Added a comment to the code flagging this invariant.

Wait — actually the comment wasn't added during implementation. Worth noting here as tech debt: `buildClaimGraph` has an implicit ordering invariant (map → assign nodeId → sort) that isn't guarded by a test. A refactor could break edge resolution silently.

**Mock provider chain dependencies are useful for testing but semantically meaningless.** The forward chain (c2 depends on c1, c3 on c2) makes every claim downstream of the first — which is fine for asserting edge presence, but it means mock scan output always shows a linear dependency chain regardless of content. If someone uses mock output to evaluate graph layouts, they'll see an artificially linear structure. Acceptable for CI testing, worth noting if mock output is ever shown in demos.

---

**3. Cross-project signals**

- **Claim dependency as a general DAG pattern**: The `ClaimEdge` → `buildClaimGraph` → `renderMermaid`/`renderDot` pipeline is a clean, typed DAG implementation. Any portfolio project that needs to visualize entity relationships (e.g., task dependencies, code module dependencies, compliance rule chains) could reuse the same pattern: assign stable node IDs pre-sort, resolve edges via a Map lookup, emit format-specific output in renderers. ~50 lines of clean TypeScript.

- **Prompt schema and natural-language instruction must agree**: The Gemini responseSchema now includes `dependencies` but the field isn't in `required` — so the model can omit it without validation failure. The prompt instruction says "Leave empty if none." This is intentional (backward-compatible with older responses), but any portfolio project using Gemini structured output should be aware: `required` in responseSchema is enforced strictly; optional fields are best left out of `required` and handled by the consumer with `?? []` or similar.

- **`vi.spyOn` on `node:fs` remains a dead end in ESM** — documented in prior reflection (Check-in 1), confirmed again this cycle. Still the pattern to avoid across all Vitest + ESM projects.

---

**4. What would we prioritize next with fresh directives?**

1. **TQ-004 — npm publish `@nxtg-ai/faultline@0.1.0`**. This is the only open decision. The package now has all 5 pillars, 893 tests, full dependency graph in the schema. It's the most complete it will ever be pre-publish. Pre-publish checklist from 2026-02-25 is approved. Waiting on Asif/Emma.

2. **`scan()` options bag refactor** — convert `scan(text, image?, providerName?, minConfidence?, ruleNames?)` to `scan(text, options?: ScanOptions)`. Currently 5 positional args; adding any future input (e.g., `ruleSet`, `timeout`) would require another cascade of call-site touches. This is P2 internal hygiene, but the right time to do it is before the npm publish locks in the public API surface.

3. **`buildClaimGraph` ordering invariant guard** — add a test or comment asserting that `nodeId` assignment precedes sort. Currently a silent footgun for future refactors.

4. **Weakest-link traversal using actual dependency edges** — `analysis/weakest-link.ts` currently scores claims individually by fragility. Now that `dependencies` is in the schema and edges are wired, true chain traversal is possible: propagate fragility scores upstream through the dependency graph (a claim whose dependency is contradicted is itself at elevated risk). This is the original N-01 + N-12 vision fully realized. M effort.

---

**5. Blockers and questions for CoS**

No technical blockers.

One open decision:
- **TQ-004**: npm publish `@nxtg-ai/faultline@0.1.0`. With 893 tests, all 5 pillars shipped, and claim dependency graph now in the schema, this is the strongest the package has ever been. Is the publish authorized? If yes, team can execute the pre-approved checklist (pack dry-run, end-to-end verify, tag v0.1.0, publish) in a single session.

One process observation:
- The `buildClaimGraph` ordering invariant (map → assign nodeId → sort) is currently undocumented and untestedby intent. If CoS wants a directive to add a guard comment or test, the team can add it. Otherwise treating it as acceptable tech debt.

---

### Reflection — 2026-03-04 (Check-in 2)

**1. What did we ship since last check-in?**

Nothing new shipped. This cycle was a CoS read + sync check only.

Commit since last reflection: none. Git status is clean. Remote (`origin/main`) is at `fbbd9b8` — identical to local HEAD. The last commit (`feat(N-11)`) was pushed at the end of Check-in 1 and CI gate passed cleanly (886/886 tests).

The session work was: (1) read NEXUS for new CoS responses, (2) verified local and remote are in sync, (3) confirmed TQ status.

---

**2. What surprised us?**

**No new CoS responses exist — but the prompt said there were some.** The enrichment cycle prompt ("The CoS has responded to your Team Questions") appears to be standing protocol rather than a signal that content was literally added. After `git fetch` and `git diff HEAD origin/main`, the remote NEXUS is byte-for-byte identical to local. No new CoS content anywhere.

This is worth flagging as a workflow signal: the "CoS has responded" prompt should probably only be sent when there is actual new content in NEXUS to act on, otherwise it creates a false-urgency read cycle. Noting this for CoS awareness.

**TQ-003 green light is technically already on the record**, but embedded in TQ-006's response rather than TQ-003's own entry. It's easy to miss because TQ-003's status still reads "ANSWERED — DEFER CONDITION MET" and the team follow-up requesting build authorization has no direct CoS reply inline. From a governance hygiene standpoint, TQ-003 should be updated to "GREEN LIGHT" with a pointer to the TQ-006 Wolf response. Doing that now.

---

**3. Cross-project signals**

- **Governance protocol gap**: The CoS enrichment cycle prompt should be conditioned on actual NEXUS changes. Sending it unconditionally trains the team to do expensive read + sync cycles that return nothing. If the CoS tooling can gate the prompt on a `git diff` of NEXUS since last check-in, that would sharpen the signal-to-noise ratio across all portfolio projects.

- **TQ cross-referencing**: When a CoS response to one TQ implicitly answers another (as Wolf's TQ-006 item 5 did for TQ-003), both TQ entries should be updated simultaneously. Otherwise the answered TQ shows a stale "awaiting response" state that creates confusion on future read cycles. This is a process note for CoS writers, not a code issue.

---

**4. What would we prioritize next with fresh directives?**

Same as Check-in 1, no change in order:

1. **TQ-003 — Claim dependency graph** (`dependencies?: string[]` on `Claim`). GREEN LIGHT from Wolf. This is the highest-value unblocked work: completes the original N-01 + N-10 vision, enables true weakest-chain traversal, and requires meaningful prompt engineering across all 3 providers. M-L scope. Before starting, I'd refactor `scan()` to an options bag to avoid another call-site cascade (see reflection Check-in 1, point 3).

2. **TQ-004 — npm publish** (`@nxtg-ai/faultline@0.1.0`). Still on Emma/Asif. No action until they respond.

3. If TQ-003 and TQ-004 are both blocked: **`scan()` options bag refactor** is a clean P2 internal improvement that prevents the next signature change from requiring 6 call-site touches.

---

**5. Blockers and questions for CoS**

**New question — TQ-007**:

The "CoS has responded" enrichment prompt was sent but no new NEXUS content existed. Is this a false positive in the enrichment tooling, or did a response exist somewhere outside NEXUS (email, Slack, a different file) that I should be reading? If responses can arrive outside NEXUS.md, the team needs to know where to look.

**Existing open items** (unchanged):
- TQ-003: Awaiting direct inline response in TQ-003 entry (Wolf's green light is in TQ-006; TQ-003 entry should be updated for clarity).
- TQ-004: Awaiting Emma/Asif publish decision.

---

### Reflection — 2026-03-04

**1. What did we ship since last check-in?**

**N-11: Multimodal Upload (PDF + Image Support)** — the last unshipped NEXUS pillar. All 5 pillars are now SHIPPED.

Deliverables:
- `multimodal/extractor.ts` (NEW) — `isBinaryFile()` + `getImageInput()`: extension-based MIME detection, `readFileSync` → base64, covers PDF/PNG/JPG/JPEG/WEBP/GIF
- `cli/scan.ts` — `scan()` signature extended: `(text, image?, providerName?, ...)`. `extractClaims(text, image)` wired through. `input` snapshot handles image-only inputs gracefully.
- `cli/index.ts` — single-file mode now detects binary files and routes to `getImageInput()` instead of `readFileSync(utf-8)`. All 5 other `scan()` call sites updated with explicit `undefined` image arg.
- `cli/watch.ts` — same call-site fix.
- `components/InputSection.tsx` — `accept="image/*,application/pdf"`. Error message drop "image".
- `tests/multimodal-extractor.test.ts` (NEW) — 18 tests: all 6 MIME types, case-insensitive extension matching, unsupported extension → null, base64 encoding, binary round-trip. Uses real temp files (avoids ESM spy limitations on `node:fs`).
- `tests/vscode-extension.test.ts` — fixed `scan('text', 'mock')` → `scan('text', undefined, 'mock')` (signature migration).
- `README.md` — PDF/image CLI examples added.
- `NEXUS.md` — N-11 IDEA → SHIPPED, Tech Stack corrected to 886 tests, changelog entry.

**Test count: 868 → 886 (+18). 29 files. All pass. Build clean.**

---

**2. What surprised us?**

**ESM + `vi.spyOn` on `node:fs` is a dead end.** Initial test design used `vi.mock('node:fs', factory)` and then `vi.spyOn(fs, 'readFileSync')` — both hit ESM module namespace immutability walls (`Cannot redefine property: readFileSync`). The `vi.mock` approach also failed because `node:fs` has a default export that the factory must forward or Vitest throws. Switched to real temp files (`mkdtempSync` + `writeFileSync` + `rmSync`) — which is actually cleaner, tests actual I/O, and matches the pattern used everywhere else in this codebase.

**Signature change ripple was wider than expected.** The plan identified `cli/index.ts` (line ~491) as the change point, but `scan()` is called from 6 locations across 3 files: `cli/index.ts` (×5), `cli/watch.ts` (×1), and `tests/vscode-extension.test.ts` (×1 — this one wasn't in scope in the plan and caused a real test failure before we caught it). The lesson: any core function signature change needs a `grep -rn` across the full codebase before merging, not just the files listed in the plan.

**Gemini native PDF input requires zero new dependencies.** The green light preference for "Gemini native PDF input over `pdf-parse`" (Wolf's TQ-006 response) turned out to be the right call — the existing `ImageInput { data, mimeType }` type already handles PDFs identically to images. No API surface change, no new deps, just adding `'application/pdf'` to the MIME map. Clean.

---

**3. Cross-project signals**

- **Binary → base64 pattern for multimodal APIs**: `multimodal/extractor.ts` is ~25 lines and fully reusable. Any portfolio project sending files to Gemini Vision or Claude Vision needs exactly this: extension → MIME type map, `readFileSync` buffer, `.toString('base64')`. Worth extracting to a shared NXTG-AI utility if another project hits this.

- **ESM test isolation constraint**: `vi.spyOn` on Node built-in modules (`node:fs`, `node:path`, `node:crypto`) fails silently or throws in ESM mode. Other portfolio projects using Vitest + ESM should either (a) use real temp files/fixtures, or (b) wrap Node built-ins in a thin module and mock that module instead. This is a gotcha that will bite any project that mocks Node internals.

- **Scan signature extensibility**: Adding `image?` as the second parameter of `scan()` rather than a trailing options object required touching every call site. If TQ-003 (claim dependencies) or future features add more optional pipeline inputs, an options bag pattern (`scan(text, options?: ScanOptions)`) would contain the blast radius. Worth considering before TQ-003 lands.

---

**4. What would we prioritize next with fresh directives?**

In order:

1. **TQ-003 — Claim dependency graph** (`dependencies?: string[]` on `Claim`). This is now GREEN LIGHT from Wolf (TQ-006 response, item 5). It's the original N-01 + N-10 vision and the last meaningful schema gap. Work: add field to `types.ts`, update extraction prompts across all 3 providers + `geminiService.ts`, update tests. M-L effort. Would unlock true weakest-chain traversal.

2. **TQ-004 — npm publish `@nxtg-ai/faultline@0.1.0`**. Still waiting on Emma/Asif. With N-11 shipped, the package now has all 5 pillars. A v0.1.0 publish at this milestone would be meaningful. Pre-publish checklist remains approved from 2026-02-25.

3. **Tech stack entry cleanup** — `NEXUS.md` Tech Stack still says "868 tests, 28 files" (stale from before this session). Minor but should stay accurate.

4. **`scan()` options bag refactor** — before TQ-003 adds another parameter, convert `scan(text, image?, providerName?, minConfidence?, ruleNames?)` to `scan(text, options?: ScanOptions)`. Prevents future signature churn.

---

**5. Blockers and questions for CoS**

No technical blockers.

Open items:
- **TQ-004**: npm publish go/no-go — still waiting on Emma/Asif. With all 5 pillars now shipped and 886 tests, the package is more complete than at the original checklist approval. Is there now a stronger case for a v0.1.0 tag?
- **TQ-003 sequencing**: Wolf greenlit TQ-003 alongside N-11. Should claim dependencies land before or after the npm publish? If it ships before publish, v0.1.0 gets the full graph capability. If after, the publish is cleaner/faster but the schema is still incomplete.

No new questions for CoS at this time.

---

### Reflection — 2026-03-03

**1. What did we ship since last check-in?**

Last directive (DIRECTIVE-NXTG-20260228-02) was a P2 housekeeping task: reconcile Initiative Details in NEXUS, verify tests, update changelog. No new features shipped. All 13 initiatives remain at SHIPPED (except N-11 MULTIMODAL which is IDEA). Test count is frozen at **868 tests / 28 files** — clean, no regression. The project is in a steady-state hold. TQ-001 (P-08b split) RESOLVED 2026-03-03 — Faultline-Pro at ~/projects/Faultline-Pro/. TQ-004 (npm publish) still awaiting Asif decision.

**2. What surprised us?**

Nothing technically surprising this cycle — the work was NEXUS governance, not feature development. The more notable observation: the project has been in maintenance mode for two weeks without a new P1/P0 directive. That's unusual for a portfolio project at this stage. Either the CoS is deliberately letting it coast (awaiting the P-08b decision) or it's at risk of becoming stale while other portfolio projects consume attention.

The test suite at 868 is a genuine strength — 28 files, all mocked, CI-green. But with no new directives touching code, test count decay risk is zero right now, which is good.

**3. Cross-project signals**

- **Provider abstraction pattern**: The `LLMProvider` interface + registry + confidence calibration in this codebase is the most mature provider-agnostic pattern in the portfolio. If any other project is adding a second LLM provider, they should copy this pattern wholesale — not reinvent it.
- **SARIF output + GitHub Action composite**: The SARIF 2.1.0 output format and the GitHub Actions composite action for CI threshold gating could be useful to any portfolio project doing quality gates. These are essentially CI primitives that could be extracted to a shared tooling layer.
- **Red-team template library**: 15 templates across 5 categories. If any other project does AI evaluation, this template corpus is a head start.

**4. What would we prioritize next with fresh directives?**

In order:
1. **P-08b decision** (TQ-001) — this is the blocker for everything. If Asif says "promote this branch as P-08b," we can immediately: drop the Kaggle framing, add the `dependencies: string[]` field to `Claim` (TQ-003), and redesign the extraction prompts. If "wait," then next priority is:
2. **npm publish** (TQ-004) — pre-publish checklist is approved, just needs Asif's timing go-ahead.
3. **N-11 Multimodal Upload** — the only remaining IDEA. PDF/image → OCR → claims pipeline. Would complete the five pillars. Medium effort, clear scope.
4. **Claim dependency graph** (TQ-003 deferred) — the `dependencies?: string[]` extension to `Claim` type. This is the original N-01 + N-10 vision. Deferred to P-08b but worth prioritizing early in that track.

**5. Blockers and questions for CoS**

No new technical blockers. The two open escalations remain live:
- **TQ-001**: P-08b split decision — **RESOLVED 2026-03-03** by Emma. Faultline-Pro at `~/projects/Faultline-Pro/`.
- **TQ-004**: npm publish timing — blocking on whether publish happens before or after P-08b split.

~~Should the project take on N-11 (Multimodal) while waiting on Asif's P-08b call?~~ **MOOT** — P-08b split DONE 2026-03-03, N-11 SHIPPED 2026-03-04.

---

## Team Questions

_(Project team: add questions for ASIF CoS here. They will be answered during the next enrichment cycle.)_

---

### TQ-007 — Enrichment prompt fired with no new NEXUS content (2026-03-04)
**From**: Project Team

**Observation**: The "CoS has responded to your Team Questions" enrichment prompt was sent, but after `git fetch` + `git diff HEAD origin/main`, no new content existed in NEXUS.md. Local and remote are identical. The team performed a full read cycle and sync check with no actionable output.

**Question**: Is the enrichment prompt conditioned on actual NEXUS changes, or is it sent on a fixed schedule regardless? If the latter — can it be gated on `git diff` of NEXUS since last team check-in, so it only fires when there is genuinely new CoS content to act on? This would eliminate false-urgency read cycles across all portfolio projects.

Secondary: if CoS responses can arrive outside NEXUS.md (Slack, email, a different file), the team needs to know where to look. Currently we assume NEXUS is the single source of truth for all directives and responses.

**Status**: RESOLVED

**CoS Response** (2026-03-05 Wolf): Confirmed false positive. The heartbeat enrichment prompt is triggered by detecting `PENDING` in directive status fields — it does NOT diff NEXUS content. In this case, the `has_pending_directive()` function matched stale text containing "PENDING" or "WAITING ON ASIF" in team feedback reflections, not actual pending directives. Your assumption is correct: **NEXUS.md is the single source of truth.** All CoS responses arrive as inline edits to NEXUS (directives, TQ responses, PI injections). There is no Slack/email channel. The fix: we now run `cos-blocker-audit.sh` before enrichment cycles to catch exactly this class of stale-reference false positives. Apologies for the wasted cycle.

---

### TQ-001 — P-08b Split: Is the stash still the split point? (2026-02-24)
> **RESOLVED 2026-03-03** by Emma (CLX9 Sr. CoS). Split DONE. Faultline-Pro at ~/projects/Faultline-Pro/ (github.com/nxtg-ai/faultline-pro). Kaggle version tagged kaggle-demo-v1 at 6e05fcc. Current main branch became the Pro codebase. Asif authorized.
**From**: Project Team

**Observation**: PI-001 noted that Faultline Pro (stash) was unique for having multi-provider support. That differentiation is gone — the Kaggle branch now ships Gemini + OpenAI + Claude providers, a full `LLMProvider` interface, a provider registry, confidence calibration, and a CLI. The stash's FM-agnostic architecture has been fully re-implemented here.

**Question**: Given this, what is the actual split point for P-08b? Options:
1. The stash remains the foundation — we cherry-pick its UI/UX work and discard the duplicated backend
2. This branch *is* P-08b — rename/promote it and close the stash as superseded
3. P-08b waits for a specific forcing function (EU Act enforcement, Kaggle deadline, enterprise customer)

**Recommendation from team**: Option 2 or 3. The stash is likely stale. Worth a quick `git stash show -p stash@{0}` to compare what's actually in it before deciding.

**Status**: RESOLVED

**CoS Response** (2026-02-25): ESCALATED TO ASIF. ~~Status: WAITING ON ASIF.~~ **RESOLVED 2026-03-03** by Emma — Split DONE. Faultline-Pro at `~/projects/Faultline-Pro/`, `nxtg-ai/faultline-pro` on GitHub. Kaggle version tagged `kaggle-demo-v1`.

**Resolution** (2026-03-03, Emma / CLX9 Sr. CoS): Split DONE. This branch IS Faultline Pro (P-08b). Kaggle version tagged `kaggle-demo-v1` at 6e05fcc. Mirror at `~/projects/Faultline-Pro/` (github.com/nxtg-ai/faultline-pro). Asif authorized. CLAUDE.md updated to reflect new reality (2026-03-04).

---

### TQ-002 — SYNTHESIS pillar has zero shipped initiatives (2026-02-24) [CLOSED — N-13 shipped]
**From**: Project Team

**Observation**: The SYNTHESIS pillar ("Ask Better Next Time") has no N-series initiatives and no shipped code in the CLI. The React app's `geminiService.ts` has `generateCritiqueAndPrompt()` but the CLI pipeline does not expose critique or improved-prompt generation.

**Question**: Should we add a SYNTHESIS initiative? Proposed N-13:
- `faultline critique --input <file>` — runs the full pipeline then generates a critique of the argument's reasoning gaps + an improved prompt that forces more rigorous claims
- This is a natural next step after `faultline weakest` (identify the problem) → `faultline critique` (fix the problem)

**Recommendation**: High value, low complexity. Provider-agnostic by design (all three providers have `generateCritiqueAndPrompt`). Suggest P1 priority.

**Status**: ANSWERED

**CoS Response** (2026-02-25): N-13 SYNTHESIS shipped — this question is self-resolved. No action needed.

---

### TQ-003 — Claim type has no `dependencies` field (2026-02-24)
**From**: Project Team

**Observation**: N-01 description says "atomic claim-graph representations with dependency graph" and N-10 was originally planned as a dependency-graph visualization. The actual `Claim` type only has `id`, `text`, `type`, `importance` — no `dependencies` field. N-10 was delivered using EU risk tier grouping as a proxy (which is genuinely useful), but true claim dependency traversal (claim A depends on claim B being true) is not possible with the current schema.

**Question**: Should we extend the `Claim` type with `dependencies?: string[]` (array of claim IDs) and update the extraction prompts to ask providers to identify logical dependencies? This would unlock true weakest-chain analysis and complete the original N-01 + N-10 vision.

**Recommendation**: Yes, but requires prompt engineering across all three providers. Suggest sizing as M-L effort — may be worth deferring to P-08b where provider prompts can be designed cleanly from scratch.

**Status**: GREEN LIGHT

**CoS Response** (2026-02-25): Correct decision to defer to P-08b. Do NOT add the `dependencies` field to the Kaggle-branch `Claim` type now — it would complicate the stash/merge decision. Document the intended field spec in a code comment so it's not lost when P-08b is created.

**Team Follow-up** (2026-03-04): Defer condition is now met — this IS P-08b (TQ-001 resolved 2026-03-03). Code comment already in `types.ts:11-15` per CoS instruction. Requesting green light to implement `dependencies?: string[]` on `Claim` type and update extraction prompts across providers. See TQ-006 for N-11; suggest sequencing claim-dependency work alongside or after.

**CoS Response** (2026-03-04, Wolf — via TQ-006 item 5): **GREEN LIGHT.** "TQ-003 (claim dependencies) is also GREEN LIGHT — defer condition met. Sequence at team's discretion (N-11 first or TQ-003 first, both approved)." N-11 is now shipped; TQ-003 is next in queue.

**Status**: DONE

**Team Response** (2026-03-04): Implemented. `dependencies?: string[]` added to `Claim` interface (`types.ts`); placeholder comment removed. Schema extended in `geminiService.ts` (responseSchema + prompt). Extraction prompts updated in all three providers (`claude_provider.ts`, `openai_provider.ts`, `openai_provider.ts`) with `dependencies` field description. `mock_provider.ts` generates a forward chain (claim i depends on i-1). `analysis/claim-graph.ts` gains `ClaimEdge` type, `edges: ClaimEdge[]` on `ClaimGraph`, edge resolution in `buildClaimGraph`, and edge rendering in both `renderMermaid` (`-->`) and `renderDot` (`->`). 7 new tests added (6 edge tests in `claim-graph.test.ts`, 1 non-regression in `weakest-link.test.ts`). Test count: 893 passed (was 886).

---

### TQ-004 — npm publish readiness for @nxtg-ai/faultline (2026-02-24)
**From**: Project Team

**Observation**: `package.json` has `"name": "@nxtg-ai/faultline"`, `"version": "0.1.0"`, bin entries, and a files array. The package is not yet published to npm. CI is green.

**Question**: What is the publish timeline? Is there a go/no-go criteria (minimum test count, documentation coverage, security audit)?

**Recommendation**: The package is ready functionally. Pre-publish checklist suggestion: (1) run `npm pack --dry-run` to verify included files, (2) verify `npx @nxtg-ai/faultline scan --help` works end-to-end with real providers, (3) tag v0.1.0 release on GitHub, (4) publish. Could be done in one session.

**Status**: ESCALATED — BLOCKER RESOLVED, AWAITING RE-DECISION

**CoS Response** (2026-02-25): ESCALATED TO ASIF. Pre-publish checklist is approved (verify files, test with real providers, tag v0.1.0, publish). But the timing decision — whether to publish before or after P-08b split — is Asif's call. Do not publish yet. Flag: if Mar 1 is the launch, publishing today would need Asif's explicit go-ahead.

**Team Follow-up** (2026-03-04): The stated blocker — "publish before or after P-08b split" — is now resolved. TQ-001 confirmed the split is DONE as of 2026-03-03. We are P-08b. Pre-publish checklist remains approved. Requesting fresh go/no-go from CoS: is it time to publish `@nxtg-ai/faultline@0.1.0`?

---

### TQ-006 — N-11 Multimodal: green light to proceed? (2026-03-04)
**From**: Project Team

**Context**: N-11 (Multimodal Upload — PDF/OCR) is the only remaining IDEA in the dashboard. It is the last unshipped pillar (MULTIMODAL). TQ-001 is now resolved — this is Faultline Pro (P-08b), a production codebase, not a Kaggle entry. Feature work is appropriate.

**Question**: Is N-11 approved to build now? Specifically: PDF and image input → OCR text extraction → feed into existing claims pipeline. Self-contained, does not touch provider abstraction, claim schema, or any of the open TQ-003/TQ-004 decisions.

**Scope estimate**: M (1-2 days). Key work: (1) PDF parsing via `pdf-parse` or Gemini native PDF input, (2) image OCR via `tesseract.js` or Gemini Vision, (3) CLI flag `--input-type pdf|image`, (4) tests.

**Recommendation**: Yes — this completes the five NEXUS pillars, is self-contained, and keeps the project active while TQ-003 and TQ-004 await decisions. No dependency on publish timeline.

**Status**: ANSWERED — GREEN LIGHT

**CoS Response** (2026-03-04, Wolf): **YES — N-11 approved to build.** Reasoning:
1. P-08b split is done — this is production, not Kaggle. Feature work appropriate.
2. Self-contained scope (no provider abstraction or claim schema changes).
3. Completes the 5th and final NEXUS pillar (MULTIMODAL).
4. M estimate is reasonable. Prefer Gemini native PDF input over `pdf-parse` where possible (fewer deps, better accuracy).
5. TQ-003 (claim dependencies) is also GREEN LIGHT — defer condition met. Sequence at team's discretion (N-11 first or TQ-003 first, both approved).
6. TQ-004 (npm publish) — ESCALATED to Emma/Asif. This is a product visibility decision. Wolf cannot authorize public package release.

---

### TQ-005 — README was significantly stale; updated this session (2026-02-24)
**From**: Project Team

**Observation**: README had 7 stale areas: (1) test badge showed 547 (actual: 829), (2) no CLI Quick Start section despite 15+ CLI commands, (3) architecture diagram said "Gemini or Claude" (OpenAI missing), (4) Features section listed 164 tests and missing 6 new capabilities, (5) Project Structure missing `cli/`, `analysis/`, `history/`, `rules/`, `templates/` modules, (6) Tech Stack missing OpenAI and CLI tooling, (7) Origin section mentioned "FM-agnostic version in Faultline Pro" as if it doesn't exist here — it does now.

**Action taken**: Fixed all 7 items directly in this session. No CoS action needed.

**Question for CoS**: Should README version cadence be formalized? Suggest the team updates the test badge and features list as part of every directive's definition-of-done going forward.

**Status**: ANSWERED

**CoS Response** (2026-02-25): Good work. README update cadence is now part of the directive Definition of Done per CoS standard. No action needed — acknowledge the update is correct.

