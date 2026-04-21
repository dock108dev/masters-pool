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

## Hosts and routing

Routing is **host-based**. The subdomain decides which app renders; paths never carry a `clubCode`.

| Host | Purpose |
|---|---|
| `onboard.dock108.dev` | Marketing + "claim your club" form, coordinator sign-up |
| `admin.dock108.dev` | Platform superadmin dashboard (requires `publicMetadata.role === 'superadmin'`) |
| `rvcc.dock108.dev` | Raritan Valley CC — public pool + coordinator admin |
| `crestmont.dock108.dev` | Crestmont CC — public pool + coordinator admin |
| `dock108.dev` (apex) | 301 redirects to `onboard.dock108.dev` |

Clubs are configured in `src/config/clubs.ts`:

| Club | Code | Pick Format |
|---|---|---|
| Raritan Valley CC | `rvcc` | Pick any 7, best 5 count |
| Crestmont CC | `crestmont` | Pick 1 from each of 6 groups, best 4 count |

**Local dev:** vite serves any `*.localhost` hostname thanks to `server.host: true`. Use:

- `onboard.localhost:5173` — onboarding + sign-up
- `admin.localhost:5173` — superadmin
- `rvcc.localhost:5173` / `crestmont.localhost:5173` — club apps

Bare `localhost:5173` redirects to `onboard.localhost:5173`.

### Routes per host

**`onboard.*`**
| Path | Auth | Description |
|---|---|---|
| `/` | None | Marketing + claim form |
| `/sign-up` | None | Coordinator sign-up (Clerk) |
| `/welcome` | None | Post-signup confirmation |

**`admin.*`**
| Path | Auth | Description |
|---|---|---|
| `/sign-in` | None | Superadmin sign-in (Clerk) |
| `/` | `superadmin` | Platform ops dashboard |

**`rvcc.*` / `crestmont.*` (club)**
| Path | Auth | Description |
|---|---|---|
| `/` | None | Club home |
| `/rules` | None | Club rules |
| `/entry` | None | Pick submission (when `allowSelfServiceEntry: true`) |
| `/leaderboard` | None | Live standings |
| `/leaderboard/entry/:entryId` | None | Entry detail |
| `/lookup` | None | Email-based entry lookup |
| `/enter/:poolToken` | None | Public entry link |
| `/admin/sign-in` | None | Coordinator sign-in |
| `/admin` | `org:admin` | Pool listing |
| `/admin/pools/new` | `org:admin` | Pool creation wizard |
| `/admin/pools/:poolId` | `org:admin` | Coordinator pool dashboard |
| `/admin/branding` | `org:admin` | Branding settings |

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
