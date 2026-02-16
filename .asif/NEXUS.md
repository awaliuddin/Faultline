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
**What**: Build unit/integration tests beyond geminiService.test.ts. Target full pipeline coverage.
**Next step**: Integration tests for verify/extract/synthesis pipeline.

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
