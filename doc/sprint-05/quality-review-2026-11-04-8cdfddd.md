# Quality review: sprint-05-ai-coach, 2026-11-04, scope: 907584b..8cdfddd

Reviewed commit: `8cdfddd98a84dbfaaaa511695230543e322844a9` on
`sprint-05-ai-coach`, clean working tree, level with `origin/sprint-05-ai-coach`.
Reviewer: Claude (read-only, no changes to application code).

## Summary

| Check                           | Result        | Key detail                                         |
| ------------------------------- | ------------- | -------------------------------------------------- |
| `npm run lint`                  | PASS          | exit 0                                             |
| `npm run format:check`          | PASS          | "All matched files use Prettier code style!"       |
| `npm run typecheck`             | PASS          | exit 0 (frontend + backend)                        |
| `npm run test:coverage`         | PASS          | 292 tests, 292 pass, 0 fail/cancelled/skipped/todo |
| Focused rerun (cooldown + resp) | PASS          | 26 tests, 26 pass                                  |
| Frontend build (scratch outDir) | PASS          | exit 0, tracked `frontend/dist` untouched          |
| Three npm audits                | NOT COMPLETED | need network; not approved for this review         |
| Hosted Quality run 41876888767  | NOT CHECKED   | need network; not approved for this review         |

Shared-config changes in range: none.
Files created or changed by the checks: none (`git status --short` empty afterward).

## Measured

- Overall coverage: 100% lines, 98.36% branches, 100% functions.
- `backend/src/invitation-cooldown.js`: 100 / 100 / 100.
- `backend/src/invitation-response.js`: 100 / 95.83 / 100. The partial branch is
  in code this commit did not change.
- Coverage measures which code ran. It does not prove the code is correct.

## Judged (my reading, not tool output)

No correctness defects found. Checked against the approved scope:

- **Start time:** `invitation-response.js:54` replaces `respondedAt` on the
  Maybe Later → Decline write, so the clock starts at the final decline. The
  existing transition matrix (`invitation-response.test.js:100-130`) checks this.
- **Deadline is inclusive:** `>=` at `invitation-cooldown.js:34`. Tests cover
  1 ms before the deadline, the deadline itself, and 1 ms after.
- **Repeated decline does not reset the clock:** a repeated decline cannot match
  the status filter at `invitation-response.js:50-53`, so it only reads. The new
  regression would fail if `respondedAt` were rewritten.
- **Date mutation:** neither function mutates its inputs, and the returned date
  is a new object. There is a test for this.
- **DST, month ends and leap days:** the code adds a fixed number of
  milliseconds, so it needs no time-zone handling.
- **Invalid input fails closed:** null, strings, numbers, invalid Dates and
  overflowing Dates all return no qualification. A `now` of `null` skips the
  default and returns false.
- **Not wired in:** nothing in `backend/src` imports the module. The permanent
  `invitation_pair_unique` index is unchanged (`invitation-storage.js:82-85`).

| #   | Severity | file:line                                          | Finding                                                                                                                                                                                   | Why it matters                                                                                                                                                                              | Proposed fix                                                                                                                                                               |
| --- | -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Low      | `backend/src/invitation-cooldown.js:14-20`         | `declineRetryAt` returns `null` both for "not declined" and for "declined, but the date is missing or corrupt."                                                                           | A later API or UI caller could read `null` as "no wait applies." The safe function, `hasDeclineCooldownElapsed`, fails closed correctly; the risk is only in how the date helper gets used. | Decide this during integration. Enforce only through `hasDeclineCooldownElapsed`. If a declined record has a bad date, log it and refuse the resend. No change needed now. |
| 2   | Low      | `backend/test/invitation-response.test.js:222-239` | The mocked clock starts at the Unix epoch (time zero), so the first decline is recorded as 1970-01-01.                                                                                    | The test still works. It is just harder to read, and it doesn't show the date the clock replaced.                                                                                           | Optional: start the mock clock at a realistic time, e.g. `enable({ apis: ['Date'], now: Date.parse('2026-11-04T12:00:00Z') })`.                                            |
| 3   | Info     | `backend/test/invitation-cooldown.test.js:75-91`   | The DST cases check UTC instants. Across a DST change, the local time shifts by an hour (10:00 EDT becomes 09:00 EST).                                                                    | The behavior is correct. But a future screen showing "same time next month" would be wrong.                                                                                                 | When the UI step comes, show the exact instant in the user's local time and don't promise the same clock hour.                                                             |
| 4   | Info     | (future integration)                               | The helpers check one record that was already read from the database. Real enforcement will also have to check the pair's current state and insert the new invitation in one atomic step. | Checking first and inserting later leaves a gap where a concurrent request can slip in.                                                                                                     | This is already listed in the progress entry's next step: a "concurrency-safe replacement" for the pair index. Keep it as a design requirement.                            |

### Duplication

None. The module is small and has one purpose. `DECLINE_COOLDOWN_MS` is reused
in the tests instead of being copied.

### Documentation

Checked `sprint-05-progress.md`, `sprint-5.md` and `commands_sprint-05.md`.
Their claims match the source and this run: nine new tests, 292 total, and
coverage at 100% lines, 98.36% branches, 100% functions. The JSDoc comments
state clearly that a timing result is not permission to resend.

### Tests

Each changed behavior has a success test and a failure test. Assertions check
exact dates, booleans, response bodies, stored state and the write count. These
tests would fail on likely mistakes, such as `>` instead of `>=`, calendar-month
arithmetic, or rewriting the decline time. Limitations: storage is simulated, and
the tests never touch live MongoDB or a real BSON round-trip.

## Guardrail gaps (known list)

All UNCHANGED by this commit. No NEW or WORSENED gaps found. Tests remain
outside typecheck. The cooldown tests pass `null` and strings as `now` on
purpose, and the JSDoc type would reject those values.

## Manual checklist

- [ ] Keyboard-only navigation and visible focus: NOT CHECKED (no UI change)
- [ ] Screen reader pass; color contrast: NOT CHECKED
- [ ] Real browser at mobile and desktop widths: NOT CHECKED
- [ ] Live MongoDB/Atlas behavior: NOT CHECKED (not approved)
- [x] Security judgment: reviewed the server-clock requirement and that the
      helper grants no permission (source reading only)
- [ ] UX copy and tone: NOT CHECKED (no copy change)

## Not checked

npm audits and the hosted Quality run (both need network), the browser/Playwright
suite (no frontend change), and live database behavior.

## Readiness

The timing foundation is ready for the next separately approved design step:
a history-preserving, concurrency-safe replacement for the permanent pair index,
plus a migration plan. None of the findings blocks that step.

## Proposed fixes (optional; waiting for Shorena's choice)

1. Make the repeated-decline test start its mock clock at a realistic time
   (finding 2). This changes only the test file.
2. Add findings 1, 3 and 4 as requirements in the future resend design document.
   This changes only documentation, at the next design step.
