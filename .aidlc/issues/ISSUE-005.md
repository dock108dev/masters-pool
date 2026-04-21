# ISSUE-005: Leaderboard Polling & Staleness Indicators (Frontend)

**Priority**: medium
**Labels**: phase-1, frontend, leaderboard
**Dependencies**: ISSUE-001
**Status**: implemented

## Description

Wire the `LeaderboardPage` to poll the `/leaderboard` endpoint every 15–20 seconds during an active tournament. Show a 'Last updated' timestamp. Display a subtle staleness badge if data is older than 60 seconds. Avoid full-page re-renders on each poll — diff and update only changed rows. Reference: `docs/research/real-time-leaderboard-update-patterns.md`.

## Acceptance Criteria

- [ ] `useApi` hook (or a new `usePolling` hook) accepts an `intervalMs` parameter and re-fetches automatically.
- [ ] Poll interval is 15s when tournament is active, paused when tab is hidden (`visibilitychange` event).
- [ ] A 'Last updated HH:MM:SS' label renders below the leaderboard table and updates on each successful fetch.
- [ ] If the most recent fetch is >60s old, a yellow 'Data may be stale' badge appears next to the timestamp.
- [ ] A failed fetch increments a retry counter; after 3 consecutive failures a red 'Unable to update' banner is shown.
- [ ] Vitest test: polling hook calls fetch at correct intervals; tab-hidden pauses calls.
- [ ] No full unmount/remount of `LeaderboardTable` on each poll — only prop updates.

## Implementation Notes


Attempt 1: Extended useApi with lastUpdatedAt/consecutiveFailures fields and tab-visibility pause (visibilitychange event skips interval polls when hidden, refetches on show). LeaderboardPage: 5-min poll → 15s, error banner after 3 failures, 'Last updated HH:MM:SS' label, isStale state via 10s setInterval driving yellow 'Data may be stale' badge. New src/__tests__/hooks/useApi.test.ts (8 tests). LeaderboardPage tests updated with 4 new assertions. All 466 tests pass.