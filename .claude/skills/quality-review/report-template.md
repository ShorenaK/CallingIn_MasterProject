# Quality review: <branch>, <date>, scope: <changed|full>

## Summary

| Check | Result | Key detail |
| ----- | ------ | ---------- |

(lint, format, typecheck, tests+coverage, build, 3 audits; use PASS / FAIL /
NOT COMPLETED)
Shared-config changes: <none | list>
Files created or changed by checks: <none | list>

## Measured

Coverage per file (line / branch / function) and every uncovered area.
Exact errors from failing commands.

## Judged (my reading, not tool output)

| #   | Severity | file:line | Finding | Why it matters | Proposed fix |
| --- | -------- | --------- | ------- | -------------- | ------------ |

Sections: Duplication, Documentation, Tests (success/failure gaps).

## Guardrail gaps (known list)

NEW/WORSENED first, then UNCHANGED, then RESOLVED.
Known gaps as of 2026-10-16:

- No automated accessibility checks (no jsx-a11y, axe)
- No frontend tests
- No enforced coverage threshold
- frontend/dist tracked in Git despite being gitignored
- Typecheck excludes tests, test-support, vite/eslint config
- No duplication detector
- No Dependabot, CodeQL, or secret scanning
- No pre-push hook, CODEOWNERS, or PR template
- No rate limit on /api/auth/register (scrypt is expensive)

Resolved since the original list (verified October 17, 2026):

- Node-version declarations: `.nvmrc` and `engines.node` exist in all three
  package manifests. Recheck their consistency during each review.

## Manual checklist (NOT CHECKED unless verified this run)

- [ ] Keyboard-only navigation and visible focus
- [ ] Screen reader pass; color contrast
- [ ] Real browser at mobile and desktop widths
- [ ] Live MongoDB/Atlas behavior
- [ ] Security judgment (rate limiting, email enumeration, secrets)
- [ ] UX copy and tone

## Not checked

<everything skipped, and why>

## Proposed fixes

1. ... (what / why / how / files / tradeoff). Waiting for your choice.
