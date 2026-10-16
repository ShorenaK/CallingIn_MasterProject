# Review rubric

## Duplication (DRY)

- Flag repeated logic or near-identical blocks that would change together.
- Suggest extraction only for 3+ real uses or when a bug fix would need
  repeating. Do not propose abstractions to satisfy a checklist.
- Also check tests and fixtures for copy-paste that hides what differs.

## Documentation

- Flag README/doc statements that no longer match behavior (counts, commands,
  endpoints, scripts).
- Flag exported or non-obvious functions whose contract, units, or failure
  behavior is unclear.
- Do not ask for comments that restate the code or for docs on trivial code.

## Test meaningfulness

For each changed behavior:

- Is there a success test AND a failure or edge test (invalid input, missing
  dependency, storage failure, timeout, duplicate)?
- Do assertions check outcomes (status, body, stored state, UI text), not just
  "did not throw"?
- Would the test fail if the code were wrong? Name tests that wouldn't.
- Coverage: list every uncovered file/line/branch from the measured report,
  plus behavior gaps that coverage cannot show (frontend has no tests; error
  and retry states; response contents). A coverage percentage is a measure of
  executed lines, not evidence of correctness; never say "fully tested".
- Coverage gaps are findings, not automatic blockers. Thresholds are a
  separate decision for the user.

## Guardrail gaps

Compare against the known-gaps list in report-template.md. Mark each gap
NEW, WORSENED, UNCHANGED, or RESOLVED. Highlight NEW and WORSENED first.
Also check for files outside typecheck, lint, or coverage scope.
