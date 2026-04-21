# Masters Pool Web

Golf pool frontend for the Masters tournament at private country clubs. Coordinators manage pools through a Clerk-authenticated admin area; entrants submit picks via public entry links or the club entry form.

Backend: [sports-data-admin](https://github.com/dock108dev/sports-data-admin)

## Quick Start

```bash
npm install
npm run dev        # Dev server at http://localhost:5173
npm test           # Run all tests
npm run build      # Production build → dist/
```

The app defaults to `MockApiClient` — no backend needed for local development. To connect to the real backend, set `VITE_API_BASE_URL` and swap the export in `src/api/client.ts`.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key for coordinator auth |
| `VITE_API_BASE_URL` | Optional | Backend base URL (mock used when absent) |
| `SPORTS_API_KEY` | Production only | Injected by nginx into backend proxy requests |

## Clubs

Two clubs are configured in `src/config/clubs.ts`:

| Club | Code | Pick Format |
|---|---|---|
| Raritan Valley CC | `rvcc` | Pick any 7, best 5 count |
| Crestmont CC | `crestmont` | Pick 1 from each of 6 groups, best 4 count |

All routes are club-scoped: `/:clubCode/entry`, `/:clubCode/leaderboard`, etc.
Root `/` shows the marketing landing page.

## Routes

| Path | Auth | Description |
|---|---|---|
| `/` | None | Marketing landing page |
| `/sign-up` | None | Coordinator sign-up (Clerk) |
| `/:clubCode` | None | Club home |
| `/:clubCode/rules` | None | Club rules |
| `/:clubCode/entry` | None | Pick submission (when `allowSelfServiceEntry: true`) |
| `/:clubCode/leaderboard` | None | Live standings |
| `/:clubCode/leaderboard/entry/:entryId` | None | Entry detail view |
| `/:clubCode/lookup` | None | Email-based entry lookup |
| `/:clubCode/enter/:poolToken` | None | Public entry link (no login required) |
| `/:clubCode/admin/sign-in` | None | Coordinator sign-in (Clerk) |
| `/:clubCode/admin` | Clerk | Admin overview |
| `/:clubCode/admin/pools` | Clerk | Pool listing |
| `/:clubCode/admin/pools/new` | Clerk | Pool creation wizard |
| `/:clubCode/admin/pools/:poolId` | Clerk | Coordinator pool dashboard |
| `/:clubCode/admin/branding` | Clerk | Branding settings |

## Deployment

Pushing to `main` builds a Docker image, pushes to `ghcr.io`, and deploys to Hetzner via SSH.
Production runs on port 3002. nginx proxies `/api/*` to the backend and injects `X-API-Key`.

See [CI workflow](.github/workflows/ci.yml) for the full pipeline: lint → typecheck → test → build → docker → deploy.

## Documentation

| Doc | Contents |
|---|---|
| [Architecture](docs/architecture.md) | Component breakdown, data flows, directory structure |
| [Design Principles](docs/design.md) | Coding patterns and anti-patterns |
| [Roadmap](docs/roadmap.md) | Feature phases and acceptance criteria |
| [API Contracts](docs/api-contracts.md) | All 22 backend endpoint signatures |
| [Contributing](CLAUDE.md) | Style, naming, testing, git conventions |
