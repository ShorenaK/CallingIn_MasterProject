# CallingIn Frontend

React with JavaScript and Vite. See the [project README](../README.md)
for CallingIn’s scope and semester plan.

## Install and run

From the repository root, install the frontend dependencies and start Vite:

```bash
cd frontend
npm ci
npm run dev
```

In a second terminal, from the repository root, start Express:

```bash
cd backend
npm ci
npm start
```

Open http://127.0.0.1:5173/. The welcome page checks `/api/health` through
Vite’s development proxy, which forwards `/api` requests to Express at
http://127.0.0.1:3001. Use the default backend port for this configuration.
Stop each server with Ctrl+C in its terminal.

The page uses the existing logo at `../public/images/logo1.png`.
Accounts, AI assistance, invitations, and messaging are not implemented.

## Verification commands

With both servers running, check the backend through the frontend proxy:

```bash
curl http://127.0.0.1:5173/api/health
```

Expected JSON: `{"status":"ok"}`.

From `frontend/`, create a production build:

```bash
npm run build
```

The build writes to `frontend/dist/`. These commands are instructions,
not a record of completed verification. The production build and automated
endpoint test are pending the quality-check step. The current template lint
command still uses Oxlint; ESLint and Prettier setup is also pending.
