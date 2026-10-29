# CallingIn

Express + MongoDB backend, React/Vite frontend. JavaScript with `checkJs`.

## Commands (run from repo root)

- `npm run check`: lint, format, typecheck, backend tests, build
- `npm run test:coverage`: backend tests with coverage
- Note: `npm run build` writes to the tracked frontend/dist. Prefer building
  to a temp --outDir when only verifying.

## Rules

- Do not edit, stage, commit, push, or merge without approval; the user
  handles Git submissions.
- Never read or print .env files or credentials.
- Explain proposed changes and wait for approval.
- No comments or abstractions added only to satisfy a checklist.
- Coverage percentages measure executed code, not correctness.
- Use /quality-review before PRs and at sprint end; do not run it unprompted.
