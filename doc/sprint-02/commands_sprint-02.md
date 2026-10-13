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

## Publish later Sprint 02 documentation changes

```bash
npm run check
git add doc/sprint-02/
npm run precommit
git commit -m "Describe the new changes"
git push
```

This stages documentation only. Backend implementation changes must also be
reviewed and staged separately when ready. The student handles Git submissions.

## Step-by-step work record

### 1. Prepare Sprint 02

Created `sprint-02-authentication` from main and added the progress plan,
AI development log, and this commands/work-record file under `doc/sprint-02/`.

### 2. Set up MongoDB Atlas

Created the CallingIn project and development cluster in Atlas. The setup
instructions covered creating a database user, allowing the current public IP,
and obtaining the Node.js connection string. Atlas hosts the database;
the application still runs locally.

### 3. Install the MongoDB driver

Ran from the CallingIn root:

```bash
npm --prefix backend install mongodb
```

Installed `mongodb` 7.7.0. This updated `backend/package.json` and
`backend/package-lock.json` and installed the package in `backend/node_modules/`.
The installation audit reported zero known vulnerabilities.

### 4. Prepare private database settings

The backend folder already existed. Created `backend/.env` and updated
`backend/.env.example` with configuration placeholders:

```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=callingin_dev
```

Real connection settings belong only in `backend/.env`, which Git ignores.
The tracked `.env.example` must contain placeholders only. Credentials were
briefly placed in the example; it was restored to placeholders. The exposed
password needs resetting in Atlas, with the updated string saved privately in
`.env`. Password reset and a successful live connection are not yet confirmed.

### 5. Add connection code

The `backend/src/` folder now contains:

| File          | Purpose                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `app.js`      | Defines Express and the health endpoint; existed before this step.                                          |
| `server.js`   | Connects and pings MongoDB before opening the HTTP port; closes the connection on shutdown.                 |
| `database.js` | Reads settings, validates placeholders, connects to the chosen database, and hides sensitive driver errors. |

The `backend/test/` folder contains:

| File               | Purpose                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `health.test.js`   | Existing tests for the health response and an unknown route returning 404.                                                                        |
| `database.test.js` | Four new tests for missing settings, successful connect/ping/close, and safe cleanup on connection or ping failure. Uses test doubles, not Atlas. |

### 6. Verify the work

Commands for checking the application:

```bash
npm run check
```

At the connection-code check, lint, all six backend tests, and the frontend
build passed individually. The combined check stopped because this document
needed formatting. The live Atlas check stopped because private settings still
contained a placeholder; it did not establish a connection.

To format this work record, then rerun the full check:

```bash
npx --no-install prettier --write doc/sprint-02/commands_sprint-02.md
npm run check
```

### Next step

Reset the exposed Atlas password, save the updated connection string in private
`backend/.env`, and verify the live connection. Registration, login, and other
account features have not been implemented yet.

Add future commands and short explanations here as each step is completed.
