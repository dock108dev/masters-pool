# ISSUE-017: Per-Club Branding (Logo & Color Scheme)

**Priority**: low
**Labels**: phase-4, frontend, backend, coordinator
**Dependencies**: ISSUE-007, ISSUE-008
**Status**: implemented

## Description

Allow each club to store a logo URL and primary/accent color scheme in the backend `clubs` table. Frontend fetches branding at runtime via a new endpoint and applies it as CSS custom properties at the `ClubRoot` level, replacing hardcoded Tailwind values on the standings page and public entry form header. Coordinator UI includes a branding settings section. Reference: ISSUE-007 (club identity), ISSUE-008 (coordinator UI surface).

## Acceptance Criteria

- [ ] `clubs` table gains `logo_url TEXT`, `primary_color VARCHAR(7)`, `accent_color VARCHAR(7)` columns (nullable; null falls back to platform defaults).
- [ ] `GET /clubs/:id/branding` returns `{ logo_url, primary_color, accent_color }` and is publicly readable (no auth required).
- [ ] `ClubRoot` fetches branding on mount and sets `--club-primary` and `--club-accent` CSS custom properties on the root element.
- [ ] Standings page header and public entry form use `var(--club-primary)` for button and badge colors — no hardcoded hex values in those components.
- [ ] Coordinator settings page includes a branding form (logo URL input, color pickers) with a live preview of header and button appearance.
- [ ] When branding endpoint returns 404 or network error, platform default colors (`#1e3a5f`, `#c9a84c`) are applied without console errors.
- [ ] Vitest test: `ClubRoot` sets correct CSS custom properties when mock branding returns `{ primary_color: '#123456' }`.
- [ ] Vitest test: `ClubRoot` applies default colors when branding fetch fails.

## Implementation Notes


Attempt 1: Added ClubBranding type to domain.ts; added getClubBranding/updateClubBranding to ApiClient interface, API_ENDPOINTS, MockApiClient, and HttpApiClient. ClubRoot now fetches branding on mount and sets --club-primary/--club-accent on document.documentElement, falling back to #1e3a5f/#c9a84c on error. index.css updated: --club-primary/--club-accent CSS vars added to :root, header background, .btn-primary, and .qualification-badge.qualified now use these vars. Created BrandingSettingsPage at admin/branding with logo URL input, color pickers, live preview, and save action. Wired into App.tsx and PageWrappers.tsx. Two Vitest tests added and all 613 tests pass.