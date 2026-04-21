# Design Principles and Patterns

Design principles, patterns, and conventions for `club-golf-tools` — a self-serve private pool hosting platform built on React 19, TypeScript, Vite, and React Router 7.

> Note: Some code examples in this document are illustrative of the target design, not exact copies of current source. The authoritative code is in `src/`. Where examples diverge from reality, the code wins.

---

## 1. Design Principles

### 1.1 Invalid States Are Unrepresentable

Every pool, entry, and score has a lifecycle. The type system and data model must make illegal transitions impossible — not just guarded by runtime checks.

- Pool configs are immutable after lock. The `PoolStatus` type encodes lifecycle: `'draft' | 'open' | 'locked' | 'live' | 'final' | 'archived'`.
- An entry in `submitted` state carries no editable fields.
- Cut status is not a boolean — it is a discriminated union (`'active' | 'cut' | 'wd' | 'dq'`).

Prefer modeling state as a union over adding optional fields to a single object.

```ts
type PoolStatus = 'draft' | 'open' | 'locked' | 'live' | 'final' | 'archived';

type DraftPool = { status: 'draft'; config: MutablePoolConfig };
type LockedPool = { status: 'locked' | 'open' | 'live' | 'final' | 'archived'; config: Readonly<LockedPoolConfig> };

type Pool = DraftPool | LockedPool;

function isLocked(pool: Pool): pool is LockedPool {
  return pool.status !== 'draft';
}
```

### 1.2 Scoring Is a Pure Function

The scoring engine must be deterministic and replayable. Given the same tournament data and pool config, it must always produce the same standings. No side effects, no manual overrides, no silent patches.

- Scores are computed from raw tournament events, not from prior computed standings.
- A full recompute is always possible and should be the normal path.
- Scoring rules live in a versioned config snapshot attached to the pool — never inferred from global state.

### 1.3 The Platform Must Remove Itself from the Critical Path

Every feature decision is evaluated against one question: *Can a club run this pool without the operator touching it once?* Features that require manual intervention are technical debt, not shortcuts.

- Validation blocks bad data at entry time — it is not a support ticket later.
- Lock timing is automatic, derived from authoritative tee-time data plus a hard-deadline failsafe.
- Audit trails answer "did my pick save?" before the user asks.

### 1.4 Trust Is Earned Through Consistency

A wrong leaderboard kills the product. Correctness > speed, UI polish, or feature count.

- Every scoring rule must have tests covering cut-line ties, WD/DQ during a round, and the specific dual-condition Masters cut rule.
- Score data corrections are applied as new events — history is never rewritten.

### 1.5 Clubs Own Their Data; Tenants Are Strictly Isolated

Pool data for RVCC must never be readable by Crestmont. Tenant isolation is enforced at the data layer (Row-Level Security on `pool_events`), not just the application layer. Clerk org membership validates coordinator access server-side.

---

## 2. Patterns

### 2.1 Interface-Driven API Client

The API client is defined as a TypeScript interface (`ApiClient` in `src/api/types.ts`). Concrete implementations (`HttpApiClient`, `MockApiClient`) satisfy the same contract. Components depend only on the interface — they never import `HttpApiClient` directly.

```ts
// src/api/types.ts
export interface ApiClient {
  getActivePool(clubCode: ClubCode): Promise<PoolSummary | null>;
  getLeaderboard(poolId: number): Promise<LeaderboardData>;
  submitEntry(poolId: number, request: EntrySubmissionRequest): Promise<EntrySubmissionResponse>;
  // ... 19 more methods
}
```

Swap the implementation in tests without touching component code. Tests always use `MockApiClient` — never mock `fetch` directly.

### 2.2 Immutable Pool Config Snapshot

Pool configuration is captured as a locked JSON snapshot at the moment the pool is published. All scoring runs against this snapshot — never against mutable state. The backend enforces immutability; the frontend reflects the locked state visually.

### 2.3 Discriminated Union Error Handling

API errors are typed discriminated unions, not thrown strings or generic `Error` subclasses. Callers are forced to handle each variant.

```ts
type ApiError =
  | { kind: 'network'; message: string }
  | { kind: 'not_found' }
  | { kind: 'unauthorized' }
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'server'; status: number; message: string };

type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
```

### 2.4 Slot-Based Picker — Invalid States Unrepresentable in UI

Entry pickers render a fixed set of typed slots. A player can only occupy one slot at a time. Duplicate picks and missing slots are impossible to submit because the UI enforces them structurally.

`GolferPicker` (RVCC flat format) and `BucketPicker` (Crestmont bucketed format) both enforce this. The submit button is disabled until all slots are filled.

### 2.5 Polling with Stale-While-Revalidate

The leaderboard polls on a fixed interval via `useApi`. The previous value is displayed while a refresh is in flight, preventing layout thrash.

```ts
// useApi with pollInterval
const { data, loading, error } = useApi(
  () => apiClient.getLeaderboard(poolId),
  [poolId],
  { pollInterval: 300_000 }
);
```

### 2.6 Tenant Context via URL Path

Club identity is resolved from the `/:clubCode` URL parameter in `ClubRoot`. `ClubOutlet` provides `ClubConfig` to all child pages via context. No component reads `window.location` directly.

```tsx
// src/pages/ClubRoot.tsx
const { clubCode } = useParams<{ clubCode: ClubCode }>();
const config = getClubConfig(clubCode);
// ...provides config to child routes via ClubOutlet
```

### 2.7 Coordinator Auth Guard

All admin routes are wrapped in `CoordinatorRoute`, which checks the Clerk session and redirects to `/:clubCode/admin/sign-in` if unauthenticated. Public routes (leaderboard, entry, lookup) never require auth.

---

## 3. Anti-Patterns

### 3.1 Manual Score Adjustments

Never provide an admin UI to edit computed standings directly. If a score is wrong, fix the upstream event data and recompute. Manual overrides produce unexplainable results and destroy user trust.

### 3.2 CSV as the Primary Entry Path

CSV upload is an escape hatch for bulk imports, not the happy path. It must be validated against pool rules before any data is persisted. Prefer the slot-based picker UI as the primary flow.

### 3.3 Mutable Pool Config After Lock

Never allow any field in `LockedPoolConfig` to change after the pool is published. If a club needs a config change after lock, the correct answer is "no."

### 3.4 Implicit Tenant from Session Only

Never derive which club's data to show from a session cookie alone without a data-layer guard. Tenant filtering belongs in the data query (RLS), not just the UI.

### 3.5 `any` in the API Response Path

Do not type API responses as `any`. Use TypeScript interfaces at every API boundary. An upstream API returning an unexpected shape should surface as a typed error, not a runtime crash.

### 3.6 Shared Mutable State for Picks in Progress

Do not store in-progress entry picks in a global store. Entry state lives in the picker component tree and is only committed on confirmed submission.

---

## 4. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase, `.tsx` | `BucketPicker.tsx` |
| Hooks | `use` prefix, camelCase, `.ts` | `useApi.ts`, `useClubConfig.ts` |
| Utility / pure functions | camelCase, `.ts` | `formatting.ts`, `validation.ts` |
| Types / interfaces | camelCase, `.ts` | `domain.ts` |
| Test files | `src/__tests__/` mirroring `src/` structure | `src/__tests__/components/entry/BucketPicker.test.tsx` |

### Identifiers

- **Interfaces**: no `I` prefix — `ApiClient`, not `IApiClient`
- **Type aliases for unions**: noun describing the union — `CutStatus`, `PoolStatus`
- **Event handlers**: `handle` prefix — `handlePlayerSelect`, `handleSubmit`
- **Boolean flags**: `is`/`has`/`can` prefix — `isLocked`, `hasMadeCut`, `canSubmit`
- **Async functions**: verb + noun — `fetchLeaderboard`, `submitEntry`
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level config — `POLL_INTERVAL_MS`, `CLUB_CONFIGS`, `API_ENDPOINTS`

### Directories

```
src/
  api/          # ApiClient interface, HttpApiClient, MockApiClient
  components/   # shared UI components (no business logic)
    common/     # LoadingState, ErrorState, EmptyState
    coordinator/# ReferralWidget
    entry/      # GolferPicker (RVCC), BucketPicker (Crestmont)
    layout/     # Header, Footer, Layout, LockCountdownWidget
    leaderboard/# LeaderboardTable, GolferCell
    onboarding/ # OnboardingChecklist, UpgradePrompt
  config/       # CLUB_CONFIGS, subdomain resolver
  engines/      # Pool wizard UI engine
  hooks/        # useApi, useClubConfig
  pages/        # route-level components (public + coordinator)
  types/        # domain.ts — all shared domain types
  utils/        # formatting, validation, fieldHelpers, poolWizardUtils
  __tests__/    # mirrors src/ structure
```

---

## 5. Error Handling

### Strategy

Errors fall into three zones:

| Zone | Examples | Strategy |
|---|---|---|
| **User error** | Missing pick, duplicate selection | Inline validation; block submission; never save partial state |
| **External boundary** | API timeout, 4xx | Typed `ApiError` result; surface specific message; allow retry |
| **System fault** | 5xx, unexpected shape | Generic error boundary; do not expose internals |

### Rules

1. **Never `throw` across component boundaries.** Components receive `Result<T>` from hooks and render based on `ok` flag.
2. **Validate at the boundary.** Treat unexpected API shapes as errors, not silent fallbacks.
3. **Errors shown to users must be actionable.** "Something went wrong" is not acceptable. Tell the user what to do.
4. **Lock timing failures use a hard-deadline failsafe.** If tee-time data is unavailable, the pool locks at the pre-configured hard deadline rather than staying open indefinitely.

---

## 6. Testing Strategy

### What to Test

| Layer | What | How |
|---|---|---|
| **Entry validation** | Duplicate picks, missing slots, invalid players | Unit tests on `validateEntryForm()` |
| **Formatting** | Score display, position suffixes, status labels | Unit tests on `formatting.ts` |
| **API client** | Mock adapter behavior, data consistency | Unit tests via `MockApiClient` |
| **Components** | User interactions, slot state, submission flow | Testing Library + Vitest |
| **Pages** | Loading, error, and empty states; club-specific rendering | Testing Library + Vitest |
| **Hooks** | Poll lifecycle, error states | Vitest with fake timers |

### Frameworks

- **Vitest** — test runner (`globals: true`, `jsdom` environment)
- **@testing-library/react** — component interaction tests
- **@testing-library/jest-dom** — DOM matchers
- **MockApiClient** (`src/api/mock/adapters.ts`) — in-memory mock for component tests; never mock `fetch` directly

### Test File Location

Tests live in `src/__tests__/` mirroring the `src/` structure:

```
src/components/leaderboard/LeaderboardTable.tsx
→ src/__tests__/components/leaderboard/LeaderboardTable.test.tsx
```

### Mock Data

Deterministic fixture data lives in `src/api/mock/data.ts`. Add new fixtures there; don't inline large data objects in test files. Tests that assert on leaderboard order, picks, or standings depend on fixed seeds — don't randomize mock data.

### Club-Specific Testing

Test club-specific behavior separately for RVCC (flat picks) and Crestmont (bucketed picks). Both formats share components but have different validation paths.
