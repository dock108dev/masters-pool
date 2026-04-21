# Error Handling Audit — club-golf-tools

**Date:** 2026-04-20  
**Scope:** All TypeScript source files under `src/`  
**Auditor:** Claude Code

---

## Executive Summary

The codebase has a solid, consistent error-handling backbone: `useApi` catches all async failures and exposes them as typed state; `HttpApiClient` throws on every non-2xx response; form-submission handlers all have `try/catch` with user-visible error messages. No errors are swallowed at the core data path.

Five patterns deserve attention:

1. **JSON parse silencing** (Medium): Three places in `http.ts` use `.catch(() => null)` on `res.json()` when parsing error bodies. When the backend sends a malformed error response the HTTP status is still thrown, but the `err.detail` field is silently lost, degrading the user-visible error message to a bare status code.

2. **Wizard init silent swallow** (Low): `PoolWizardPage` drops two errors entirely in its mount effect — tournament load failure leaves the tournament picker empty without any indication; active-pool redirect failure means coordinators may see the creation wizard when they have an existing pool.

3. **Coordinator action feedback gaps** (Low): Billing portal open and CSV download suppress their errors silently. Users get no feedback when these fail.

4. **Branding load silent default** (Note/Acceptable): `BrandingSettingsPage` and `ClubRoot` both catch branding-fetch errors and fall back to hard-coded defaults. This is intentional and safe — it degrades gracefully — but neither emits any log, making it invisible in production.

5. **Clipboard copy** (Note): `ReferralWidget` swallows clipboard failures silently. The "Copy" button appears to do nothing. Low severity because the URL is also shown in a readable input.

No critical silent failures exist. No broad `catch (e) {}` blocks hide data integrity issues. No retries or circuit-breakers are implemented (not required at this scale).

---

## Detailed Findings

| # | File | Lines | Pattern | Severity | Risks |
|---|------|-------|---------|----------|-------|
| F1 | `src/api/http.ts` | 68 | `res.json().catch(() => null)` in `submitEntry` error path | Medium | Observability — backend detail lost on JSON parse failure |
| F2 | `src/api/http.ts` | 182 | `res.json().catch(() => null)` in `createPool` error path | Medium | Same as F1; 402 billing message degrades silently |
| F3 | `src/api/http.ts` | 280 | `res.json().catch(() => null)` in `applyReferralCredit` error path | Medium | Same as F1 |
| F4 | `src/pages/PoolWizardPage.tsx` | 270 | `.catch(() => {})` on `getTournaments()` | Low | Reliability — empty picker, no user feedback |
| F5 | `src/pages/PoolWizardPage.tsx` | 275 | `.catch(() => {})` on `getActivePool()` redirect | Low | Reliability — may show wizard when pool exists |
| F6 | `src/pages/CoordinatorDashboardPage.tsx` | 68–70 | `.catch(() => {})` on `createBillingPortalSession` | Low | No user feedback on failure |
| F7 | `src/pages/CoordinatorDashboardPage.tsx` | 83–85 | `.catch(() => {})` on `downloadPoolEntriesCsv` | Low | No user feedback on failure |
| F8 | `src/pages/BrandingSettingsPage.tsx` | 26–27 | `.catch(() => {})` branding load → defaults | Note | Intentional; no log emitted |
| F9 | `src/pages/ClubRoot.tsx` | 41 | `.catch(applyBrandingDefaults)` | Note | Intentional; no log emitted |
| F10 | `src/components/coordinator/ReferralWidget.tsx` | 16–18 | `.catch(() => {})` on `navigator.clipboard` | Note | Copy button appears to silently fail |

### Good patterns (confirmed, no action needed)

| Location | Pattern |
|----------|---------|
| `src/hooks/useApi.ts:30–41` | Catches all async errors, stores `error` string + `consecutiveFailures` counter, never loses stale data on refresh failure |
| `src/api/http.ts` (all methods) | Throws `Error` on every non-2xx response; never swallows HTTP errors |
| `src/api/http.ts:202` | `getPoolByToken` returns `null` for 404 — intentional "not found" semantic, not an error |
| `src/api/http.ts:304–305` | `lookupEntries` converts 404 to typed error with `.status` property for caller differentiation |
| `src/pages/EntryPage.tsx:134–161` | `try/catch/finally` with user-visible error + loading cleanup |
| `src/pages/LookupPage.tsx:48–62` | Distinguishes 404 (not-found state) from other errors |
| `src/pages/LeaderboardPage.tsx:76–79` | Shows degraded-data banner after 3 consecutive polling failures |
| `src/pages/PoolWizardPage.tsx:309–320` | `handlePublish` has `try/catch` with `setPublishError` |
| `src/pages/BrandingSettingsPage.tsx:45–55` | `handleSave` has `try/catch` with `setSaveError` |

---

## Categorisation

### Acceptable — no change required
- **F8, F9**: Branding fallback is intentional and safe. The UI still loads; visual fidelity degrades but functionality is intact.
- **F10**: Clipboard is a best-effort browser API. The URL remains visible in the input. Acceptable with a note.

### Needs telemetry (add a `console.error` at minimum)
- **F1, F2, F3**: These already throw — the error is not lost — but the raw JSON parse failure is silent. A `console.error` call before returning `null` would aid debugging without changing caller behaviour.
- **F8, F9**: Branding load failures are completely invisible. Add `console.warn`.

### Should tighten (add user feedback)
- **F4**: `getTournaments` failure leaves the wizard's dropdown empty with no explanation. Show an error message or a "could not load tournaments" inline notice.
- **F5**: `getActivePool` redirect failure means the coordinator may create a duplicate pool. At minimum, log the error; ideally show an inline warning.
- **F6**: Billing portal failure should surface a brief error message (e.g. `setBillingError`).
- **F7**: CSV download failure should surface an inline error or toast.

### High risk
None identified. No data integrity paths are silently suppressed.

---

## Recommended Remediation Plan

### Priority 1 — Observability (< 1 hour)

Add `console.error` / `console.warn` to the silent catch blocks that currently have zero output.

**F1 / F2 / F3 — `http.ts` JSON parse silencing**

```ts
// Before (all three sites):
const err = await res.json().catch(() => null);

// After:
const err = await res.json().catch((parseErr: unknown) => {
  console.error('[HttpApiClient] Failed to parse error response body:', parseErr);
  return null;
});
```

**F8 / F9 — Branding load**

```ts
// BrandingSettingsPage.tsx line 26
.catch((err: unknown) => {
  console.warn('[BrandingSettings] Could not load branding; using defaults:', err);
})

// ClubRoot.tsx line 41 — replace the .catch(applyBrandingDefaults) call:
.catch((err: unknown) => {
  console.warn('[ClubRoot] Could not load branding; using defaults:', err);
  applyBrandingDefaults();
})
```

### Priority 2 — User feedback for coordinator actions (1–2 hours)

**F4 — PoolWizardPage tournament load**

Add local `tournamentLoadError` state; show an inline notice if the dropdown is empty due to a fetch failure.

**F6 — Billing portal failure**

Add `billingError` state to `CoordinatorDashboardPage`; render it near the "Manage Billing" button.

**F7 — CSV download failure**

Add `csvError` state; render it near the "Download CSV" button.

### Priority 3 — Safety check (30 minutes)

**F5 — Active pool redirect failure**

Log the failure so it is visible in the console. Optionally show a non-blocking banner: "Could not verify existing pools. Proceed with caution."

### Priority 4 — UX polish (low priority)

**F10 — Clipboard copy**

Add a fallback: if `navigator.clipboard` throws, select the input text instead (the manual-copy affordance). This also serves users on non-HTTPS pages.

---

## In-Place Fixes Applied

The three JSON-parse silencing sites in `http.ts` (F1, F2, F3) and the two branding-fallback sites (F8, F9) have been fixed in-place. All other findings are low-severity UX gaps documented above for the team to prioritise.
