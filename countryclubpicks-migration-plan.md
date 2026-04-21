# Plan: migrate frontend to `countryclubpicks.com`

## Context

Product-facing branding moves from `dock108.dev` subdomains to `countryclubpicks.com`. Backend (`sda.dock108.dev`) stays where it is — the masters-pool-web nginx container already proxies `/api/*` to it, and that proxy is host-agnostic.

Goal: cut over without losing any existing link. Old `*.dock108.dev` URLs 301 to the new equivalents so bookmarks, any emailed entry links, and the onboard claim form all keep working.

## Target state

| Host | Serves | Auth |
|---|---|---|
| `countryclubpicks.com` (apex) | Onboard/marketing + claim form | Public |
| `www.countryclubpicks.com` | 301 → apex | — |
| `rvcc.countryclubpicks.com` | RVCC club app | Public; `/admin/*` basic-auth'd |
| `crestmont.countryclubpicks.com` | Crestmont club app | Public; `/admin/*` basic-auth'd |
| `admin.countryclubpicks.com` | Superadmin dashboard | Basic auth, entire subdomain |
| `sda.dock108.dev` | Backend API | unchanged |

Redirect blanket from old zone:

| Old | Becomes |
|---|---|
| `dock108.dev` (apex) | 301 → `https://countryclubpicks.com` |
| `onboard.dock108.dev` | 301 → `https://countryclubpicks.com` |
| `rvcc.dock108.dev` | 301 → `https://rvcc.countryclubpicks.com` (preserves path) |
| `crestmont.dock108.dev` | 301 → `https://crestmont.countryclubpicks.com` |
| `admin.dock108.dev` | 301 → `https://admin.countryclubpicks.com` |
| `countryclubpicks.dock108.dev` | 301 → `https://countryclubpicks.com` |

`sda.dock108.dev` is not touched.

## Prerequisite (user action, before any code/server work)

1. **Register** `countryclubpicks.com`. While you're there, snag the plural `countryclubpicks.co` and `.golf` as cheap defense if you want; not required.
2. **Add zone to Cloudflare**, change nameservers at the registrar to Cloudflare's. Wait for zone activation (usually 15 min, sometimes a few hours).
3. **Add DNS records** in the new zone:
   - `A` · `@` · `37.27.222.59` · Proxied
   - `A` · `*` · `37.27.222.59` · Proxied
   - `CNAME` · `www` · `countryclubpicks.com` · Proxied *(or A same IP; CNAME is tidier)*
4. **Create a new Cloudflare Origin CA cert** for the new zone: SSL/TLS → Origin Server → Create Certificate → hostnames `*.countryclubpicks.com, countryclubpicks.com` → 15 years. Copy cert + key. This is a *different* cert from the existing `dock108-origin` one; they coexist.
5. **Set SSL/TLS mode = Full (strict)** on the new zone.

Nothing below runs until (1)–(5) are in place.

## Approach

### 1. Install the new Origin CA cert on Hetzner

Put alongside the existing one:

- `/etc/caddy/certs/countryclubpicks.crt` (0644, caddy:caddy)
- `/etc/caddy/certs/countryclubpicks.key` (0600, caddy:caddy)

Same pattern as the existing `dock108.crt`/`dock108.key`. No change to the existing cert files — they keep covering the dock108 zone for the 301 blocks.

### 2. Update Caddyfile

Back up `/etc/caddy/Caddyfile`. Add the new site blocks (all using the new cert), keep the existing ones but reduce them to 301 redirects.

**New blocks (countryclubpicks.com):**

```caddy
countryclubpicks.com, www.countryclubpicks.com {
    encode gzip
    tls /etc/caddy/certs/countryclubpicks.crt /etc/caddy/certs/countryclubpicks.key
    @www host www.countryclubpicks.com
    redir @www https://countryclubpicks.com{uri} permanent
    reverse_proxy localhost:3002
}

rvcc.countryclubpicks.com {
    encode gzip
    tls /etc/caddy/certs/countryclubpicks.crt /etc/caddy/certs/countryclubpicks.key
    @admin path /admin /admin/*
    basic_auth @admin {
        admin $2a$14$mjAoD3Qvctkbputwwu1woOZvLrKj8UhAqB8ygNxNwwg6G1/UBgO12
    }
    reverse_proxy localhost:3002
}

crestmont.countryclubpicks.com {
    encode gzip
    tls /etc/caddy/certs/countryclubpicks.crt /etc/caddy/certs/countryclubpicks.key
    @admin path /admin /admin/*
    basic_auth @admin {
        admin $2a$14$mjAoD3Qvctkbputwwu1woOZvLrKj8UhAqB8ygNxNwwg6G1/UBgO12
    }
    reverse_proxy localhost:3002
}

admin.countryclubpicks.com {
    encode gzip
    tls /etc/caddy/certs/countryclubpicks.crt /etc/caddy/certs/countryclubpicks.key
    basic_auth {
        admin $2a$14$mjAoD3Qvctkbputwwu1woOZvLrKj8UhAqB8ygNxNwwg6G1/UBgO12
    }
    reverse_proxy localhost:3002
}
```

**Replace existing dock108 site blocks with 301s:**

```caddy
dock108.dev, onboard.dock108.dev, countryclubpicks.dock108.dev {
    tls /etc/caddy/certs/dock108.crt /etc/caddy/certs/dock108.key
    redir https://countryclubpicks.com{uri} permanent
}

rvcc.dock108.dev {
    tls /etc/caddy/certs/dock108.crt /etc/caddy/certs/dock108.key
    redir https://rvcc.countryclubpicks.com{uri} permanent
}

crestmont.dock108.dev {
    tls /etc/caddy/certs/dock108.crt /etc/caddy/certs/dock108.key
    redir https://crestmont.countryclubpicks.com{uri} permanent
}

admin.dock108.dev {
    tls /etc/caddy/certs/dock108.crt /etc/caddy/certs/dock108.key
    redir https://admin.countryclubpicks.com{uri} permanent
}
```

`sda.dock108.dev` block is untouched (it has its own `reverse_proxy localhost:8000` routing that sends API traffic to the backend — do not move it).

Validate (`caddy validate`) then `systemctl reload caddy`.

### 3. Update frontend `classifyHost`

**Modify:** `src/config/host.ts`.

Current behavior treats the apex as a redirect. After this move, the apex IS the onboard page. Three changes:

1. Add `countryclubpicks.com` as a known zone (alongside `dock108.dev` and `localhost`).
2. Apex (`countryclubpicks.com` bare, or `www.countryclubpicks.com`) → `{ kind: 'onboard' }` instead of `{ kind: 'apex' }`. Same for local dev — `localhost` by itself becomes onboard.
3. Keep recognizing `onboard.*` as onboard and `admin.*` as admin so local dev with subdomains (`onboard.localhost`) still works.

Rough shape:

```ts
export function classifyHost(hostname = window.location.hostname): HostKind {
  const parts = hostname.split('.').filter(Boolean);
  const sub = parts[0]?.toLowerCase() ?? '';

  // Bare apex (countryclubpicks.com, localhost, 127.0.0.1) → onboard.
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'countryclubpicks.com' ||
    hostname === 'www.countryclubpicks.com' ||
    // during transition, old bare apex still redirects at Caddy layer,
    // but classify it safely anyway
    hostname === 'dock108.dev'
  ) {
    return { kind: 'onboard' };
  }

  if (sub === 'onboard' || sub === 'www') return { kind: 'onboard' };
  if (sub === 'admin') return { kind: 'admin' };
  if (isValidClubCode(sub)) return { kind: 'club', clubCode: sub };

  return { kind: 'unknown', subdomain: sub };
}
```

Delete the `'apex'` variant entirely — no caller needs it anymore. Remove `ApexRedirect` from `App.tsx`.

### 4. Small file tweaks

- **`src/App.tsx`** — remove `ApexRedirect` component (dead code after step 3).
- **`nginx.conf`** (inside the container) — update `server_name` line to include the new hosts:
  ```nginx
  server_name  countryclubpicks.com www.countryclubpicks.com
               onboard.countryclubpicks.com admin.countryclubpicks.com
               rvcc.countryclubpicks.com crestmont.countryclubpicks.com
               onboard.dock108.dev admin.dock108.dev rvcc.dock108.dev crestmont.dock108.dev _;
  ```
  The `_` default_server still catches anything unlisted — strictly the explicit list is cosmetic, but it makes debug logs readable. Remove the old dock108.dev 301 server block — Caddy handles redirects now.
- **`README.md`** — update host table to point at `countryclubpicks.com`. Local dev instructions: `localhost:5173` now serves onboard directly (no redirect); `rvcc.localhost:5173` etc. unchanged.
- **`src/__tests__/config/host.test.ts`** — update cases: apex now returns onboard; add test for `countryclubpicks.com` and `www.countryclubpicks.com`; add test for `rvcc.countryclubpicks.com` → club.
- **`src/pages/onboard/OnboardHomePage.tsx`** — the success state mentions `https://rvcc.dock108.dev` as a demo link. Change to `https://rvcc.countryclubpicks.com`. Same for `OnboardWelcomePage` if anything similar — it's been deleted, skip.

### 5. Optional but worth it now

- **Open Graph / favicon** on the onboard page. The site's first impression is now the apex; a proper `<meta property="og:title">` and `<meta property="og:description">` in `index.html` means a pro who pastes the link in an email or Slack gets a decent preview card. Low effort, meaningful for whale-hunting.
- **Analytics**. Now is the moment to add Plausible/Fathom before you start pointing traffic at the new domain. Retroactively fitting it when you have sample data is noisier.

Both are scope-creep from a pure migration but cheaper to do while the DNS/Caddy work is already open.

## Critical files

**Modify**
- `src/config/host.ts` — new zone + apex-as-onboard (biggest frontend change)
- `src/App.tsx` — drop `ApexRedirect`
- `src/__tests__/config/host.test.ts` — update assertions
- `src/pages/onboard/OnboardHomePage.tsx` — demo link URL
- `nginx.conf` — server_name list, drop the old dock108 301 block
- `README.md` — host table + local dev

**Server (Hetzner)**
- `/etc/caddy/certs/countryclubpicks.crt` + `.key` — new files
- `/etc/caddy/Caddyfile` — add four new site blocks, replace four existing blocks with 301 redirects

**No backend change.**

## Verification

After the Caddy reload and frontend redeploy:

1. `curl -sI https://countryclubpicks.com/` → 200, onboard HTML
2. `curl -sI https://rvcc.countryclubpicks.com/` → 200
3. `curl -sI https://rvcc.countryclubpicks.com/admin` → 401 without creds, 200 with `admin:4815162342`
4. `curl -sI https://admin.countryclubpicks.com/` → 401 without creds
5. `curl -sI https://www.countryclubpicks.com/` → 301 to apex
6. `curl -sI https://rvcc.dock108.dev/leaderboard` → 301 to `https://rvcc.countryclubpicks.com/leaderboard` (path preserved)
7. `curl -sI https://onboard.dock108.dev/` → 301 to `https://countryclubpicks.com/`
8. API proxy still works end-to-end:
   `curl -s https://rvcc.countryclubpicks.com/api/golf/pools?club_code=rvcc&active_only=true` → 200 JSON.
9. Browser smoke test: visit `countryclubpicks.com` — onboard marketing renders fully styled. Visit `rvcc.countryclubpicks.com` — RVCC home, leaderboard, entry flows all load. Submit a test claim on the new onboard — `POST /api/onboarding/club-claims` lands in backend.

## Ordering (minimize user-visible weirdness)

Do this in one sitting, in this order:

1. User: register + Cloudflare zone + DNS + Origin CA cert (prerequisite list above).
2. Install cert files on Hetzner.
3. Add the *new* Caddy blocks first (leaving old dock108 blocks unchanged). Validate + reload. Verify the new URLs work alongside the old ones.
4. Push the frontend changes (host classifier + OnboardHomePage link). CI rebuilds and redeploys the container.
5. Replace the old dock108 site blocks with their 301 versions. Validate + reload. Old URLs now redirect.
6. Smoke-test all 9 verification steps.
7. Optional: after 24 hours of traffic, consider whether to keep the dock108 redirect blocks forever (yes — they're free, and bookmarks are forever) or purge. Default: keep them.

Rollback: the old Caddy blocks are in `Caddyfile.bak.<timestamp>`. `cp` back, reload Caddy; frontend still works at old domains because the container is still accessible. DNS on the new domain doesn't need to be torn down — it just becomes dormant.
