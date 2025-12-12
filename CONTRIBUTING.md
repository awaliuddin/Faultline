# Contributing to Faultline

Thanks for your interest in improving Faultline! We welcome issues, PRs, and ideas.

## Getting Started
- Fork and clone the repo.
- Install deps: `npm install`.
- Copy `.env.example` to `.env` and fill the provider keys you plan to use. For public deployments, run API calls through a backend proxy to keep keys private.
- Dev server: `npm run dev`.
- Lint/format: `npm run lint` / `npm run format`.
- Tests: `npm run test -- --watch=false`.

## Pull Requests
- Create a feature branch.
- Keep PRs focused and small when possible.
- Add tests for logic changes (mock LLM/search calls).
- Run lint, test, and build locally before opening a PR.
- Describe the change and any caveats in the PR body.

## Coding Standards
- TypeScript + React.
- Prefer small, composable components.
- No secrets in the frontend; use env vars via Vite and avoid committing `.env`.
- Follow Prettier/ESLint defaults in the repo.

## Reporting Issues
- Include steps to reproduce, expected/actual behavior, and logs if available.
- If it’s a security concern, please follow the Security section instead of opening a public issue.

## Security
See `SECURITY.md` for how to report vulnerabilities responsibly.
