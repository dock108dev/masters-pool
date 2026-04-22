# club-golf-tools

Golf pool frontend for the Masters tournament at private country clubs. Coordinators manage pools through a Clerk-authenticated admin area; entrants submit picks via public entry links or the club entry form.

Backend: [sports-data-admin](https://github.com/dock108dev/sports-data-admin)

## Quick Start

```bash
npm install
npm run dev        # Dev server at http://localhost:5173
npm test           # Run all tests
npm run build      # Production build → dist/
```

The app defaults to `MockApiClient` — no backend needed for local development. To connect to the real backend, set `SPORTS_API_URL` in a `.env.local` file (the Vite dev proxy forwards `/api/*` requests to that URL with an injected `X-API-Key`).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key for coordinator auth |
| `VITE_POSTHOG_KEY` | Optional | PostHog analytics key |
| `SPORTS_API_URL` | Dev only | Backend base URL for Vite proxy (default: `https://sda.dock108.dev`) |
| `SPORTS_API_KEY` | Production only | Injected by nginx into backend proxy requests; never embedded in JS |

## Hosts and routing

Routing is **host-based**. The subdomain decides which app shell renders; paths never carry a `clubCode`.

| Host | Purpose |
|---|---|
| `countryclubpicks.com` (apex) | Marketing + "claim your club" form |
| `www.countryclubpicks.com` | 301 → apex (at edge) |
| `admin.countryclubpicks.com` | Platform superadmin dashboard |
| `rvcc.countryclubpicks.com` | Raritan Valley CC — public pool + coordinator admin |
| `crestmont.countryclubpicks.com` | Crestmont CC — public pool + coordinator admin |
| `*.dock108.dev` (legacy) | 301 to the countryclubpicks equivalents (at edge) |

Club-level routing is determined by `classifyHost()` in `src/config/host.ts`. Two clubs are configured in `src/config/clubs.ts`:

| Club | Code | Pick Format |
|---|---|---|
| Raritan Valley CC | `rvcc` | Pick any 7, best 5 count |
| Crestmont CC | `crestmont` | Pick 1 from each of 6 groups, best 4 count |

**Local dev:** Vite serves any hostname thanks to `server.host: true`. Use:

- `localhost:5173` — apex (onboarding + claim form)
- `admin.localhost:5173` — superadmin
- `rvcc.localhost:5173` / `crestmont.localhost:5173` — club apps

### Routes per host

**`countryclubpicks.com` (apex)**

| Path | Auth | Description |
|---|---|---|
| `/` | None | Marketing + claim-your-club form |
| `/checkout` | None | Stripe checkout redirect |
| `/checkout/success` | None | Post-payment club creation |
| `/admin/onboarding` | Clerk | Onboarding pool-setup wizard |

**`admin.countryclubpicks.com`**

| Path | Auth | Description |
|---|---|---|
| `/` | Caddy Basic Auth | Platform ops dashboard (MRR, pool count, poll health) |

**`rvcc.*` / `crestmont.*` (club)**

| Path | Auth | Description |
|---|---|---|
| `/` | None | Club home |
| `/rules` | None | Club rules |
| `/entry` | None | Pick submission (when `allowSelfServiceEntry: true`) |
| `/confirmation` | None | Entry confirmation |
| `/leaderboard` | None | Live standings |
| `/leaderboard/entry/:entryId` | None | Entry detail |
| `/lookup` | None | Email-based entry lookup |
| `/enter/:poolToken` | None | Public entry link |
| `/enter/:poolToken/confirmation` | None | Public entry confirmation |
| `/admin/sign-in` | None | Clerk sign-in page |
| `/admin` | Clerk | Pool listing |
| `/admin/pools` | Clerk | Pool listing |
| `/admin/pools/new` | Clerk | Pool creation wizard |
| `/admin/pools/:poolId` | Clerk | Coordinator pool dashboard |
| `/admin/branding` | Clerk | Branding settings |
| `/admin/billing` | Clerk | Billing & subscription |

Coordinator routes (`/admin/*` on club hosts) are gated by `ProtectedRoute` — Clerk session required, redirects to `/admin/sign-in` if unauthenticated. The superadmin host (`admin.*`) is gated at the Caddy layer via HTTP Basic Auth.

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
| [API Contracts](docs/api-contracts.md) | All 36 backend endpoint signatures |
| [Contributing](CLAUDE.md) | Style, naming, testing, git conventions |
