# Sprint 4 — Live/manual testing, November 3, 2026

**Timezone:** America/New_York. Exact times for individual checks were not recorded.

**Branch at recording:** `sprint-04-conversations`, `251ffbc`.

**Evidence:** Shorena performed the live checks using her own test accounts and
reported the results in conversation. These are user-reported results, not
independently executed live checks by Codex. Supplied screenshots support the
invitation/acceptance observations. Account/browser mapping was not fully recorded.
No credentials, emails, private settings, or database connection details are stored
in this record.

## Reported passes

| Check                               | Reported observation                                                                                                                   | Scope/limit                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Save Social Battery                 | Saving status works.                                                                                                                   | Reload/restart persistence is not yet confirmed.                                                 |
| Send/receive invitation             | A sent an invitation and B received it.                                                                                                | A is the sender and B the recipient for this flow.                                               |
| Acceptance and conversation opening | B accepted and opened the private conversation.                                                                                        | Acceptance is visible in the supplied screenshots.                                               |
| Partner battery visibility          | B could see A's Social Battery in the conversation.                                                                                    | Refresh availability was present; automatic refresh was not claimed.                             |
| B → A messaging                     | B sent a private message and A received it.                                                                                            | Reported by Shorena.                                                                             |
| A → B messaging                     | A sent a private message and B received it.                                                                                            | Reported by Shorena.                                                                             |
| Battery updates in both directions  | A could see B's changed status, and B could see A's changed status.                                                                    | The exact refresh sequence and each selected value were not recorded.                            |
| Duplicate invitation rejection      | A repeated attempt targeting A Sender showed: “You and A Sender already have an invitation. Only one is allowed between two accounts.” | Shorena confirmed only one invitation is allowed and corrected her earlier duplicate report.     |
| Cancel invitation draft             | Cancel works.                                                                                                                          | Empty/written-draft distinctions, focus, and pending-send behavior were not separately reported. |
| Discard invitation draft            | Discard works.                                                                                                                         | Keep writing, focus restoration, and expired-draft copying are not yet confirmed live.           |

## Subsequent outsider-test report

After receiving the outsider-test instructions, Shorena reported: “everything
works, I ran the test.” Record this as a general user-reported outsider-test pass
at the `d581e7d` checkpoint. The individual read/send/battery HTTP responses,
conversation ID, account/profile mapping, and logged-out result were not supplied;
Codex did not independently execute or observe those live requests. This broad
report does not confirm every remaining checklist item.

## Duplicate-invitation report — corrected

Shorena initially suspected that two invitations could be sent between the same
accounts. Her screenshot showed cards for differently spelled recipient names:
“B receipient” and “B recepeint”. Source inspection showed that the list resolves
current names by recipient account ID, which suggested different recipient
accounts; their IDs were not independently inspected.

After further testing, Shorena explicitly corrected the report: only one
invitation is allowed, and the repeated attempt produced the existing-invitation
notice. Record duplicate rejection as a user-reported live pass. Do not treat the
earlier suspicion as a confirmed defect, or the different-account explanation as
independently proven. No duplicate-protection code or database records were changed.

## Still pending

- Maybe Later and I need some space: Shorena said she was testing them, but no
  completed results have been reported yet. These invitation responses are
  separate from the Social Battery choice Taking Personal Space.
- Battery and message persistence after reload/restart; message pagination.
- Detailed outsider per-request results and logged-out access checks; live message
  boundaries, invisible-only input rejection, sending limits, and carried
  login-limit checks. The general outsider-test report is recorded above.
- Keep writing, session-expiry recovery, and real retained-text copying.
- Human keyboard-only, VoiceOver, Safari, 200% zoom, and actual phone checks.
- Remaining Atlas validator/index/startup/backup evidence.

Use the [Sprint 4 checklist](sprint-4.md) for the full outstanding scope.
The font-alignment request is deferred at Shorena's direction. The obsolete
Sprint 2/connection panel was removed in `251ffbc`; its removal has not been
separately reported as a live verification result.

## Separate automated/review evidence

Claude's [independent review](quality-review-2026-11-03.md) reviewed `fd0b855`.
Later approved fixes and visual cleanup are outside that original reviewed commit.
Automated checks use simulated storage/mocked APIs and do not replace this live
record. The latest panel-cleanup run passed 68 Chromium tests initially; the one
obsolete panel assertion was removed, and the corrected account/accessibility test
passed on a targeted rerun. These were separate runs, not one all-green 69-test run.

Sprint 4 remains open for unfinished testing and closeout. Recording these results
does not approve a merge. This record is local until separately submitted.
