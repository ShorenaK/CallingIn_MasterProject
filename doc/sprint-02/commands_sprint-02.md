# CallingIn — Sprint 02 Commands

Run from the CallingIn project root on `sprint-02-authentication`.
Run each command separately and stop if it fails.

## Initialize Sprint 02 planning on GitHub

```bash
npm run check
git add doc/sprint-02/
npm run precommit
git commit -m "docs: initialize Sprint 02 planning"
git push -u origin sprint-02-authentication
```

- `npm run check` runs lint, formatting checks, backend tests, and the frontend build.
- `git add doc/sprint-02/` stages only Sprint 02 documentation, including this file.
- `npm run precommit` checks matching staged files before committing.
- `git commit` saves the staged changes locally. The commit hook also runs automatically.
- `git push -u` uploads the sprint branch and sets its upstream on GitHub.

If planning was already committed and pushed, do not repeat that initialization
commit. For later changes, use a commit message describing the actual work.
Pushing this branch does not merge it into `main`.

Additional Sprint 02 commands will be added as the work progresses.
