# ISSUE-021: Mobile-Responsive Layout Audit & Fixes

**Priority**: medium
**Labels**: phase-3, frontend
**Dependencies**: ISSUE-014, ISSUE-012
**Status**: implemented

## Description

Audit and fix all key views — Leaderboard, Entry form, Entry Lookup, Coordinator Dashboard — for small-screen usage (≥320px viewport). Target: readable on an iPhone SE in portrait. Focus areas: `LeaderboardTable` horizontal overflow, `BucketPicker` tap targets, form inputs not requiring zoom. No new dependencies — use existing Tailwind responsive utilities (`sm:`, `md:` breakpoints). Do not redesign; fix overflow, clipping, and touch-target issues only.

## Acceptance Criteria

- [ ] LeaderboardTable renders without horizontal scroll at 320px viewport width — golfer name and score visible without scrolling.
- [ ] All interactive elements (buttons, pickers, inputs) have a minimum 44×44px touch target.
- [ ] Entry form inputs do not trigger browser auto-zoom on focus (font-size ≥ 16px on all inputs).
- [ ] Coordinator Dashboard table (ISSUE-010) degrades gracefully to a card layout or horizontal scroll with visible scroll affordance on <640px.
- [ ] No new Tailwind breakpoint classes introduced beyond `sm:` and `md:`.
- [ ] Vitest snapshot tests for LeaderboardTable and EntryForm confirm no regressions in rendered markup structure.
- [ ] Manual check: all flows usable with keyboard-only navigation (no mobile-only regression).

## Implementation Notes


Attempt 1: Added mobile-responsive CSS fixes: (1) SlotDropdown styles with 44px touch targets and 16px search input font-size; (2) CoordinatorDashboard styles with entries-table-scroll wrapper for horizontal scroll affordance on mobile; (3) 640px breakpoint hiding golfer columns so LeaderboardTable fits at 320px without horizontal scroll; (4) Header nav links get min-height:44px on 480px; (5) Snapshot tests for LeaderboardTable (weekday + empty) and EntryPage (entries-closed state). Files: src/index.css, src/pages/CoordinatorDashboardPage.tsx, src/__tests__/components/LeaderboardTable.test.tsx, src/__tests__/pages/EntryPage.test.tsx.