# Security Audit — club-golf-tools

**Date:** 2026-04-20  
**Auditor:** Claude (senior application security)  
**Scope:** Full codebase — frontend SPA (React/TypeScript), nginx config, Docker config, CI workflow  
**Branch:** main (as of audit date)

---

## Executive Summary

The application is a thin React SPA for golf tournament pools. Its security surface is intentionally small: no server-side rendering, no database, and minimal user-controlled data paths. The most significant finding is a **committed API key** that must be rotated immediately. Several medium-severity hardening gaps exist around HTTP security headers, user input length limits, and how backend error detail is surfaced. The authentication model (Clerk + org role check) is structurally sound but relies entirely on backend enforcement of JWT claims for admin operations — this must be verified.

Three safe in-place fixes were applied during this audit:
1. Hardcoded API key fallback removed from `vite.config.ts`
2. `Strict-Transport-Security` and `Content-Security-Policy` headers added to `nginx.conf`
3. Maximum length (100 chars) added to `validateDisplayName` in `validation.ts`

---

## 1. Confirmed Vulnerabilities

### CRIT-01 — Hardcoded API Key Committed to Repository

**Severity:** Critical  
**File:** `vite.config.ts:16` (prior to this audit's fix)

```typescript
// before fix
'X-API-Key': process.env.SPORTS_API_KEY ?? '0778e8aed6d6bc38b9d209214a22c11496130957d38a389b8b293028ec538fa1',
```

**Evidence:** The literal key `0778e8aed...` was the default fallback for the Vite dev proxy. It is now in git history.

**Exploit scenario:** Anyone with read access to this repository (or access to git history after a future public release) can use the key to call the `sports-data-admin` backend directly, bypassing nginx and any rate-limiting. Admin-level endpoints (`/api/admin/stats`, `/api/admin/poll-health`, pool creation, CSV download of all entries) are all reachable with only this key.

**Fix applied:** The hardcoded fallback was removed. The header is now only injected when `SPORTS_API_KEY` is set in the environment.

**Action required:** **Rotate the key immediately.** Removing it from future checkouts does not protect the already-committed value. Issue a new key in the backend admin and update all deployment secrets.

---

### HIGH-01 — No User-Level Auth Token Forwarded for Admin API Calls

**Severity:** High  
**File:** `src/api/http.ts` (all methods)

**Evidence:** `HttpApiClient` never sends a `Clerk` JWT (`Authorization: Bearer`) header. Every request is authenticated solely by `X-API-Key`, which is a shared service credential injected by nginx — not a per-user credential.

```typescript
// All admin calls look like this — no Authorization header:
async createPool(request: CreatePoolRequest): Promise<PoolSummary> {
  const res = await fetch(API_ENDPOINTS.createPool(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
```

This includes `createPool`, `updateClubBranding`, `getClubBilling`, `createBillingPortalSession`, `getPoolEntries`, `downloadPoolEntriesCsv`, `getAdminStats`, `getPollHealth`, `applyReferralCredit`.

**Exploit scenario:** `CoordinatorRoute` correctly enforces `orgRole === 'org:admin'` in the React layer. But this is client-side-only enforcement. If an attacker knows the `X-API-Key` (see CRIT-01) they can directly call `POST /api/golf/pools`, `PATCH /api/clubs/{code}/branding`, or `GET /api/admin/stats` with no Clerk token and no club-scoping validation — the frontend's org-role check is entirely bypassed.

**Fix:** The `HttpApiClient` should retrieve the Clerk session token and attach it as `Authorization: Bearer <token>` on coordinator/admin requests. The backend must then validate this JWT and enforce that the caller's Clerk org matches the `clubCode` being operated on.

```typescript
// Sketch of fix in http.ts:
import { useAuth } from '@clerk/clerk-react';  // or use Clerk's getToken() utility
// In each admin method:
const token = await window.Clerk?.session?.getToken();
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = `Bearer ${token}`;
```

---

## 2. Risky Patterns / Hardening Opportunities

### MED-01 — Backend `error.detail` Surfaced Verbatim to Users

**Severity:** Medium  
**Files:** `src/api/http.ts:69-74`, `src/api/http.ts:188-194`, `src/api/http.ts:281-283`

**Evidence:**
```typescript
const msg = err?.detail
  ? typeof err.detail === 'string'
    ? err.detail
    : JSON.stringify(err.detail)
  : `Submission failed: ${res.status}`;
throw new Error(msg);
```

The `detail` field is passed directly from the backend JSON response to the error message that surfaces in the UI. FastAPI (the apparent backend) includes stack traces, internal field names, and constraint violation details in `detail` for unhandled exceptions.

**Risk:** Internal schema details, SQL constraint names, or PII from related rows could leak into the browser UI and browser DevTools.

**Fix:** Define an allowlist of safe user-facing error codes and map `err.code` to human-readable messages. Discard `err.detail` in production unless it is an explicitly user-intended validation message (e.g., HTTP 422 validation errors).

---

### MED-02 — Leaderboard Response Exposes Participant Emails

**Severity:** Medium  
**File:** `src/api/http.ts:98`

**Evidence:**
```typescript
email: entry.email,   // mapped from public leaderboard response
```

The leaderboard is unauthenticated and publicly accessible. It includes `email` for every standing. These are visible in the browser network tab and to any caller of `GET /api/golf/pools/{id}/leaderboard`.

**Risk:** GDPR / privacy exposure. Golf pool participants' email addresses are harvested by anyone who visits the leaderboard URL.

**Fix:** The backend should exclude `email` from the public leaderboard response. The frontend can remove the `email` field from the `LeaderboardStanding` type once the backend stops sending it. In the meantime, the frontend should not render or store email from leaderboard responses (it currently doesn't render it, but it is stored in component state via `useApi`).

---

### MED-03 — Clerk Publishable Key Falls Back to Empty String

**Severity:** Medium  
**File:** `src/App.tsx:25`

**Evidence:**
```typescript
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined ?? '';
```

If `VITE_CLERK_PUBLISHABLE_KEY` is absent (e.g., a new dev environment or a deployment misconfiguration), `ClerkProvider` receives an empty string. Clerk will silently fail to initialize. `CoordinatorRoute` will then see `isLoaded: false` indefinitely or `isSignedIn: false`, either blocking the coordinator UI forever or (if `isLoaded` short-circuits) allowing unauthenticated access.

**Fix:** Fail fast with a visible error rather than silent degradation:
```typescript
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is not set. Coordinator auth will not work.');
}
```

For production builds, a Vite plugin or pre-build check should hard-fail on missing required env vars.

---

### MED-04 — Missing Content-Security-Policy Header (Fixed)

**Severity:** Medium  
**File:** `nginx.conf` (fixed during audit)

**Evidence before fix:** The server sent `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` but no `Content-Security-Policy`. Without a CSP, any XSS that bypasses React's escaping (e.g., via `dangerouslySetInnerHTML`, future third-party scripts, or a Clerk SDK vulnerability) can execute arbitrary scripts and exfiltrate data.

**Fix applied:** A CSP header was added in `nginx.conf`. The Clerk-related domains are approximations and must be tuned to match the actual Clerk Frontend API domain for this deployment:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.clerk.io https://*.clerk.accounts.dev; ..." always;
```

**Action required:** Verify the Clerk subdomain (visible in the `VITE_CLERK_PUBLISHABLE_KEY` value, e.g., `pk_live_Y2xlcmsuZXhhbXBsZS5jb20k` decodes the domain) and update the CSP `script-src` and `connect-src` accordingly. Test in staging — an incorrect CSP will break Clerk sign-in.

---

### MED-05 — Missing HSTS Header (Fixed)

**Severity:** Medium  
**File:** `nginx.conf` (fixed during audit)

**Evidence before fix:** No `Strict-Transport-Security` header. An attacker performing SSL stripping (e.g., on a club's WiFi network) could downgrade connections from HTTPS to HTTP, exposing session tokens and API responses.

**Fix applied:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Note:** Ensure the backend (`sda.dock108.dev`) also has HSTS configured, since it is called directly by nginx in the proxy pass.

---

### LOW-01 — Display Name Has No Maximum Length (Fixed)

**Severity:** Low  
**File:** `src/utils/validation.ts:18-26` (fixed during audit)

**Evidence before fix:** `validateDisplayName` checked for minimum length (2 chars) but had no upper bound. Arbitrarily long display names could be submitted.

**Risk:** Very long entry names cause layout issues on the leaderboard and lookup pages. If the backend stores them without a length constraint, they represent a minor denial-of-service vector against the database.

**Fix applied:** Maximum of 100 characters added to `validateDisplayName`.

---

### LOW-02 — Docker Image Not Pinned to Digest

**Severity:** Low  
**File:** `docker-compose.yml:3`

**Evidence:**
```yaml
image: ghcr.io/dock108dev/masters-pool/web:latest
```

`latest` tags are mutable. If the GHCR registry is compromised or credentials are stolen, a malicious image could be pushed to `latest` and pulled on the next restart.

**Fix:** Pin to a SHA256 digest for production deployments:
```yaml
image: ghcr.io/dock108dev/masters-pool/web:latest@sha256:<digest>
```
Update the digest as part of your deployment pipeline when a new image is built.

---

### LOW-03 — nginx Container Runs as Root

**Severity:** Low  
**File:** `Dockerfile`

**Evidence:** The Dockerfile uses `nginx:alpine` and sets no `USER` directive. nginx's worker processes run as the `nginx` user by default, but the master process (PID 1) runs as root.

**Risk:** A container escape vulnerability or misconfigured volume mount could yield a root shell on the host.

**Fix:** Add to `Dockerfile` before `CMD`:
```dockerfile
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
USER nginx
```
Note: nginx requires port 80/443 to be bound by root unless you use a non-privileged port. Since this container uses port 3002, the `USER nginx` change is safe.

---

### LOW-04 — Email Regex Accepts Some Invalid Addresses

**Severity:** Low  
**File:** `src/utils/validation.ts:12`

**Evidence:**
```typescript
!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
```

This regex allows `a@b.` (trailing dot), `a@.b` (leading dot in domain), and extremely short domains. These will fail at the backend but produce a confusing user experience.

**Risk:** Minor UX issue; the backend is the authoritative validator. No security impact since the regex is not used for access control.

**Fix:** Tighten to require at least two characters after the final dot:
```typescript
!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
```

---

### LOW-05 — `404` from `lookupEntries` Leaks Email in Error Object

**Severity:** Low / Informational  
**File:** `src/api/http.ts:305`

**Evidence:**
```typescript
throw Object.assign(new Error(`No entry found for ${email}`), { status: 404 });
```

The email is user-supplied and is embedded in the thrown `Error.message`. In `LookupPage.tsx`, the 404 path sets `notFound: true` and renders a generic "No entries found" message — the error message is not displayed. However, if a future refactor treats all errors uniformly, the email could appear in an error display.

**Fix (minor):** Omit the email from the error message: `new Error('No entry found')`. The calling code already has the email in scope.

---

## 3. Intentional / Acceptable Patterns

### ACCEPT-01 — No CSRF Tokens

State-changing requests (`submitEntry`, `createPool`, etc.) use `Content-Type: application/json`. Browsers enforce CORS for cross-origin requests with a non-simple `Content-Type`, meaning a CSRF attack from a third-party page cannot send a JSON body. CSRF tokens are not needed for a pure JSON API. This is correct behavior.

### ACCEPT-02 — Email as Entry Identifier (No Session Auth for Entry Submission)

Entry submission and lookup use email as the only identifier — there is no login. This is a deliberate product decision documented in `ARCHITECTURE.md`. The backend enforces submission limits per email. The privacy trade-off (email stored with picks) is noted in MED-02.

### ACCEPT-03 — `MockApiClient` Never Reaches the Network

Tests import `MockApiClient` directly and never instantiate `HttpApiClient`. There is no risk of test code calling a live backend or leaking credentials into test output. This is a well-designed seam.

### ACCEPT-04 — `X-API-Key` Injected by nginx, Not Browser

In production, the API key is injected by the nginx reverse proxy (`proxy_set_header X-API-Key $SPORTS_API_KEY`). The browser never touches the key. The `SPORTS_API_KEY` env var is correctly scoped to the container via `.env.production`. This is the right architectural separation — the remaining concern (HIGH-01) is that the key alone is insufficient authorization for admin operations.

### ACCEPT-05 — Subdomain Resolved from `window.location.hostname`

`getClubCodeFromHostname` reads `window.location.hostname`. This is done once at the `ClubRoot` level and validated against a hardcoded allowlist (`rvcc | crestmont`). An unknown subdomain returns `null` and renders an error page. There is no injection risk and the allowlist is tight.

---

## 4. Items Requiring Manual Verification

### VERIFY-01 — Backend Enforces Clerk JWT on Admin Endpoints

**Priority:** High

The frontend `CoordinatorRoute` checks `orgRole === 'org:admin'` (Clerk). But `HttpApiClient` does not forward a JWT to the backend. Whether the backend (`sports-data-admin`) validates a Clerk JWT for `POST /api/golf/pools`, `GET /api/admin/stats`, `PATCH /api/clubs/{code}/branding`, etc., is unknown from this codebase alone.

**What to check:** Review `sports-data-admin` middleware for endpoints under `/api/golf/pools` (POST), `/api/clubs/*/branding` (PATCH), `/api/clubs/*/billing`, `/api/admin/*`. Confirm they require and validate a `Authorization: Bearer <clerk-jwt>` header in addition to `X-API-Key`.

---

### VERIFY-02 — Backend CORS Policy

**Priority:** Medium

The nginx proxy injects `X-API-Key` for browser→nginx→backend traffic. But the backend (`sda.dock108.dev`) is also reachable directly. If the backend has `Access-Control-Allow-Origin: *`, a malicious page can call it directly using `fetch()` from any origin.

**What to check:** Review the `sports-data-admin` CORS middleware. It should allowlist only `dock108.dev` subdomains and `localhost` for development.

---

### VERIFY-03 — Backend Rate-Limits Email Lookup Endpoint

**Priority:** Medium

`LookupPage` sends one request per form submit with no client-side throttle. The backend endpoint `GET /api/golf/pools/{id}/entries/by-email?email=...` should rate-limit by IP or by email to prevent enumeration of all participant emails via a scripted loop.

**What to check:** Confirm the backend applies per-IP rate limiting (e.g., 10 req/min) on this endpoint.

---

### VERIFY-04 — `poolToken` Parameter Is Not Guessable

**Priority:** Medium  
**File:** `src/api/types.ts:61`

```typescript
poolByToken: (clubCode, token) => `${API_BASE_URL}/golf/pools/by-token/${encodeURIComponent(token)}?club_code=${clubCode}`,
```

Public entry forms use a `poolToken` path parameter (`/:clubCode/enter/:poolToken`). If pool tokens are sequential integers or short strings, they are enumerable.

**What to check:** Confirm that `pool_token` in the backend is a cryptographically random string (UUID v4 or equivalent, ≥ 128 bits of entropy) and that the endpoint returns 404 (not a timing-distinguishable response) for invalid tokens.

---

### VERIFY-05 — `adminStats` and `pollHealth` Are Not Publicly Accessible

**Priority:** High

`GET /api/admin/stats` and `GET /api/admin/poll-health` are called without any user auth token from `HttpApiClient`. These endpoints likely expose internal system state (entry counts, scoring health).

**What to check:** Confirm the backend treats these as admin-only endpoints protected by both `X-API-Key` and a valid admin Clerk JWT.

---

## Summary Table

| ID | Severity | Status | Title |
|----|----------|--------|-------|
| CRIT-01 | Critical | **Fixed (key must be rotated)** | Hardcoded API key in vite.config.ts |
| HIGH-01 | High | Open | No Clerk JWT forwarded for admin API calls |
| MED-01 | Medium | Open | Backend error.detail surfaced verbatim |
| MED-02 | Medium | Open | Leaderboard exposes participant emails |
| MED-03 | Medium | Open | Clerk key silently falls back to empty string |
| MED-04 | Medium | **Fixed** | Missing Content-Security-Policy header |
| MED-05 | Medium | **Fixed** | Missing HSTS header |
| LOW-01 | Low | **Fixed** | Display name has no max length |
| LOW-02 | Low | Open | Docker image not pinned to digest |
| LOW-03 | Low | Open | nginx container runs as root |
| LOW-04 | Low | Open | Email regex too permissive |
| LOW-05 | Low | Open | lookupEntries 404 message includes email |
| VERIFY-01 | High | Needs verification | Backend enforces JWT on admin endpoints |
| VERIFY-02 | Medium | Needs verification | Backend CORS policy |
| VERIFY-03 | Medium | Needs verification | Backend rate-limits email lookup |
| VERIFY-04 | Medium | Needs verification | poolToken entropy |
| VERIFY-05 | High | Needs verification | adminStats/pollHealth access control |

---

## Immediate Actions (Do Now)

1. **Rotate `SPORTS_API_KEY`** — the old key (`0778e8aed...`) is in git history and must be considered compromised.
2. **Add `Authorization: Bearer` to admin HTTP calls** (HIGH-01) and verify the backend validates it.
3. **Tune the CSP** to your exact Clerk Frontend API domain (MED-04 was applied with approximate domains).
4. **Verify VERIFY-01 and VERIFY-05** before adding any new admin features.
