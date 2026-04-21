# DESIGN.md

Design principles, patterns, and conventions for `club-golf-tools` — a self-serve private pool hosting platform built on React 19, TypeScript, Vite, and React Router 7.

---

## 1. Design Principles

### 1.1 Invalid States Are Unrepresentable

Every pool, entry, and score has a lifecycle. The type system and data model must make illegal transitions impossible — not just guarded by runtime checks.

- Pool configs are immutable after lock. The type `LockedPoolConfig` is distinct from `DraftPoolConfig`.
- An `Entry` in `submitted` state carries no editable fields.
- Cut status is not a boolean — it is a discriminated union (`active | cut | wd | dq`).

Prefer modeling state as a union over adding optional fields to a single object.

```ts
type PoolStatus = 'draft' | 'open' | 'locked' | 'complete';

type DraftPool = { status: 'draft'; config: MutablePoolConfig };
type LockedPool = { status: 'locked' | 'open' | 'complete'; config: Readonly<LockedPoolConfig> };

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
- API responses are validated against typed schemas before they reach the UI.
- Score data corrections are applied as new events — history is never rewritten.

### 1.5 Clubs Own Their Data; Tenants Are Strictly Isolated

Pool data for RVCC must never be readable by Crestmont. Tenant isolation is enforced at the data layer (Row-Level Security or equivalent), not just the application layer. A bug in routing logic should not produce a data leak.

---

## 2. Patterns

### 2.1 Interface-Driven API Client

The API client is defined as a TypeScript interface. Concrete implementations (HTTP fetch, mock, stub) satisfy the same contract. Components depend only on the interface.

```ts
// src/api/types.ts
export interface GolfApiClient {
  getLeaderboard(tournamentId: string): Promise<LeaderboardResponse>;
  submitEntry(poolId: string, entry: EntryPayload): Promise<EntryConfirmation>;
  getPool(poolId: string): Promise<PoolResponse>;
}

// src/api/http.ts
export function createHttpClient(baseUrl: string, apiKey: string): GolfApiClient {
  return {
    async getLeaderboard(tournamentId) {
      const res = await fetch(`${baseUrl}/tournaments/${tournamentId}/leaderboard`, {
        headers: { 'X-API-Key': apiKey },
      });
      if (!res.ok) throw new ApiError(res.status, await res.text());
      return leaderboardSchema.parse(await res.json());
    },
    // ...
  };
}
```

Swap the implementation in tests without touching component code.

### 2.2 Immutable Pool Config Snapshot

Pool configuration is captured as a locked JSON snapshot with an integrity hash at the moment the pool opens. All scoring runs against this snapshot — never against mutable state.

```ts
// src/pool/config.ts
export type LockedPoolConfig = Readonly<{
  format: 'bucket' | 'pick-x-of-y';
  buckets: ReadonlyArray<Bucket>;
  cutRule: CutRule;
  scoringVersion: string;   // e.g. "masters-2026-v1"
  lockedAt: string;         // ISO 8601
  configHash: string;       // SHA-256 of canonical JSON
}>;

export function lockConfig(draft: DraftPoolConfig, lockedAt: Date): LockedPoolConfig {
  const snapshot = { ...draft, lockedAt: lockedAt.toISOString() };
  return { ...snapshot, configHash: sha256(canonicalize(snapshot)) };
}
```

The `configHash` lets the scoring engine verify it is operating on the correct config version.

### 2.3 Discriminated Union Error Handling

API and scoring errors are typed discriminated unions, not thrown strings or generic `Error` subclasses. Callers are forced to handle each variant.

```ts
type ApiError =
  | { kind: 'network'; message: string }
  | { kind: 'not_found' }
  | { kind: 'unauthorized' }
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'server'; status: number; message: string };

type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

async function submitEntry(payload: EntryPayload): Promise<Result<EntryConfirmation>> {
  try {
    const data = await client.submitEntry(payload);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: classifyError(e) };
  }
}
```

### 2.4 Slot-Based Picker — Invalid States Unrepresentable in UI

Entry pickers render a fixed set of typed slots. A player can only occupy one slot at a time. Duplicate picks and missing slots are impossible to submit because the UI enforces them structurally.

```tsx
// src/components/entry/BucketPicker.tsx
type Slot = { bucket: number; player: Player | null };

function BucketPicker({ config, onChange }: BucketPickerProps) {
  const [slots, setSlots] = useState<Slot[]>(
    config.buckets.map((_, i) => ({ bucket: i, player: null }))
  );

  const isComplete = slots.every(s => s.player !== null);
  const selectedIds = new Set(slots.map(s => s.player?.id).filter(Boolean));

  return (
    <>
      {slots.map((slot, i) => (
        <BucketSlot
          key={i}
          slot={slot}
          bucket={config.buckets[i]}
          disabledIds={selectedIds}
          onSelect={player => {
            const next = [...slots];
            next[i] = { ...slot, player };
            setSlots(next);
            if (next.every(s => s.player !== null)) onChange(next);
          }}
        />
      ))}
      <button disabled={!isComplete}>Review Picks</button>
    </>
  );
}
```

### 2.5 Fold-Based Scoring Projection

The scoring engine reduces a stream of tournament events into a standings snapshot. It is a pure `reduce` — no mutation, no I/O.

```ts
// src/scoring/engine.ts
export function computeStandings(
  events: readonly TournamentEvent[],
  entries: readonly Entry[],
  config: LockedPoolConfig,
): Standing[] {
  const playerScores = events.reduce(applyEvent, initialScoreMap());
  return entries
    .map(entry => scoreEntry(entry, playerScores, config))
    .sort(rankComparator);
}

function applyEvent(acc: PlayerScoreMap, event: TournamentEvent): PlayerScoreMap {
  // pure — returns new map, never mutates acc
}
```

Running `computeStandings` twice on the same inputs must produce byte-identical output (sort order included — use stable sort with player ID as tiebreaker).

### 2.6 Polling with Stale-While-Revalidate

The leaderboard polls on a fixed interval. The previous value is displayed while a refresh is in flight, preventing layout thrash.

```ts
// src/hooks/useLeaderboard.ts
export function useLeaderboard(tournamentId: string, pollMs = 300_000) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const result = await client.getLeaderboard(tournamentId);
      if (!cancelled) {
        if (result.ok) setData(result.data);
        else setError(result.error);
      }
    }
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [tournamentId, pollMs]);

  return { data, error };
}
```

### 2.7 Tenant Context via URL Subdomain

Club identity is resolved from the subdomain at the router level and provided via context. No component reads `window.location` directly.

```tsx
// src/club/ClubProvider.tsx
export function ClubProvider({ children }: { children: React.ReactNode }) {
  const subdomain = window.location.hostname.split('.')[0]; // rvcc | crestmont
  const config = CLUB_CONFIGS[subdomain] ?? null;

  if (!config) return <UnsupportedClub subdomain={subdomain} />;
  return <ClubContext.Provider value={config}>{children}</ClubContext.Provider>;
}

export function useClub(): ClubConfig {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
}
```

---

## 3. Anti-Patterns

### 3.1 Manual Score Adjustments

Never provide an admin UI to edit computed standings directly. If a score is wrong, fix the upstream event data and recompute. Manual overrides produce unexplainable results and destroy user trust.

### 3.2 CSV as the Primary Entry Path

CSV upload is an escape hatch for bulk imports, not the happy path. It must be validated against pool rules before any data is persisted. Unvalidated CSV that reaches the database creates support burden. Prefer the slot-based picker UI as the primary flow.

### 3.3 Mutable Pool Config After Lock

Never allow any field in `LockedPoolConfig` to change after `lockedAt` is set. If a club needs a config change after lock, the correct answer is "no" — not a special admin override. The config hash exists to catch accidental mutations.

### 3.4 Implicit Tenant from Session Only

Never derive which club's data to show from a session cookie alone without a data-layer guard. A misconfigured route must not expose another club's pool. Tenant filtering belongs in the data query, not just the UI.

### 3.5 `any` in the API Response Path

Do not type API responses as `any` or cast without parsing. Use a schema validator (Zod or equivalent) to parse responses at the boundary. An upstream API returning unexpected shape should produce a typed `validation` error, not a runtime crash.

```ts
// Bad
const data = await res.json() as LeaderboardResponse;

// Good
const data = leaderboardSchema.parse(await res.json());
```

### 3.6 Shared Mutable State for Picks in Progress

Do not store in-progress entry picks in a global store shared across components. Entry state lives in the picker component tree and is only committed to persistent state on confirmed submission. This prevents partial saves and makes rollback trivial.

---

## 4. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase, `.tsx` | `BucketPicker.tsx` |
| Hooks | `use` prefix, camelCase, `.ts` | `useLeaderboard.ts` |
| Utility / pure functions | camelCase, `.ts` | `cutRules.ts` |
| Types / interfaces | camelCase, `.ts` | `pool.ts`, `entry.ts` |
| API client | `{domain}Client.ts` | `tournamentClient.ts` |
| Test files | co-located, `.test.ts(x)` | `cutRules.test.ts` |
| Club configs | `{clubId}.config.ts` | `rvcc.config.ts` |

### Identifiers

- **Interfaces**: no `I` prefix — `GolfApiClient`, not `IGolfApiClient`
- **Type aliases for unions**: noun describing the union — `CutStatus`, `PoolStatus`
- **Event handlers**: `handle` prefix — `handlePlayerSelect`, `handleSubmit`
- **Boolean flags**: `is`/`has`/`can` prefix — `isLocked`, `hasMadeCut`, `canSubmit`
- **Async functions**: verb + noun — `fetchLeaderboard`, `submitEntry`, `computeStandings`
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level config — `POLL_INTERVAL_MS`, `CLUB_CONFIGS`
- **Scoring versions**: kebab-case string — `"masters-2026-v1"`

### Directories

```
src/
  api/          # client interface + HTTP implementation
  club/         # per-club config, ClubProvider, useClub
  components/   # shared UI components (no business logic)
    entry/      # BucketPicker, GolferCell, ConfirmationModal
    leaderboard/# LeaderboardTable, CutLine, ScoreCell
  hooks/        # useLeaderboard, useEntry, useLockStatus
  pages/        # route-level components
  pool/         # pool config types, lockConfig, validation
  scoring/      # computeStandings, applyEvent, cutRules
  types/        # shared domain types (entry.ts, pool.ts, player.ts)
  utils/        # pure helpers (formatting, sorting, hashing)
```

---

## 5. Error Handling

### Strategy

Errors fall into three zones:

| Zone | Examples | Strategy |
|---|---|---|
| **User error** | Missing pick, duplicate selection | Inline validation; block submission; never save partial state |
| **External boundary** | API timeout, unexpected shape, 4xx | Typed `ApiError` result; surface specific message; allow retry |
| **System fault** | 5xx, scoring crash | Generic error boundary; log server-side; do not expose internals |

### Rules

1. **Never `throw` across component boundaries.** Components receive `Result<T>` from hooks and render based on `ok` flag.
2. **Validate at the boundary.** Parse API responses with a schema on receipt. Treat parse failure as a `validation` error, not a crash.
3. **No silent fallbacks.** If the scoring engine receives a player not in the tournament field, it throws — it does not silently score them as zero.
4. **Errors shown to users must be actionable.** "Something went wrong" is not acceptable. The message must tell the user what to do: "Your picks were not saved. Try submitting again, or contact your pool coordinator."
5. **Lock timing failures use a hard-deadline failsafe.** If the tee-time API is unreachable, the pool locks at the pre-configured hard deadline rather than staying open indefinitely.

```ts
// src/utils/result.ts
export type Result<T, E = ApiError> = { ok: true; data: T } | { ok: false; error: E };

export function ok<T>(data: T): Result<T> { return { ok: true, data }; }
export function err<E>(error: E): Result<never, E> { return { ok: false, error }; }
```

### Error Boundary

Each major page route is wrapped in an `ErrorBoundary`. The boundary renders a club-branded fallback, logs the error, and offers a reload action. It never exposes stack traces to the user.

---

## 6. Testing Strategy

### What to Test

| Layer | What | How |
|---|---|---|
| **Scoring engine** | Determinism, cut rules, WD/DQ, tiebreakers | Unit tests + golden file regression |
| **Pool config** | Lock immutability, hash verification | Unit tests |
| **Entry validation** | Duplicate picks, missing slots, invalid players | Unit tests on pure validator functions |
| **API client** | Schema parsing, error classification | Unit tests with `fetch` mock |
| **Components** | User interactions, slot state, submission flow | Testing Library + Vitest |
| **Hooks** | Poll lifecycle, error states, stale data | Vitest with fake timers |

### Frameworks

- **Vitest** — test runner (configured with `globals: true`, `jsdom` environment)
- **@testing-library/react** — component interaction tests
- **@testing-library/user-event** — realistic event simulation
- **MSW (Mock Service Worker)** — intercept HTTP at the network level in component tests; do not mock `fetch` directly in component tests

### Golden File Regression Tests

The scoring engine must have a set of golden files: fixed tournament event inputs paired with expected standings outputs. Tests assert that `computeStandings` matches the golden output exactly.

```ts
// src/scoring/engine.test.ts
import { computeStandings } from './engine';
import events2026 from './__fixtures__/masters-2026-events.json';
import expected2026 from './__fixtures__/masters-2026-standings.json';
import config2026 from './__fixtures__/masters-2026-config.json';

test('masters 2026 standings match golden file', () => {
  const result = computeStandings(events2026, entries2026, config2026);
  expect(result).toEqual(expected2026);
});
```

When the scoring logic changes intentionally, the golden file is updated in the same commit with a clear explanation. An unintentional diff in the golden file is a bug.

### Cut Rule Tests

The Masters cut rule (top 50 and ties **plus** within 10 of leader) must have exhaustive tests for:

- Exactly 50 players above the line (no tie)
- Tie at the 50th position that expands the field
- A player outside top 50 who survives via the 10-stroke rule
- A player who is WD before the cut is applied
- A player who is DQ during round 2

```ts
// src/scoring/cutRules.test.ts
describe('mastersCut', () => {
  it('includes players within 10 of the leader even outside top 50', () => {
    const result = applyMastersCut(fieldWith51Players_leaderAt10_51stAt19());
    expect(result.filter(p => p.cutStatus === 'active')).toHaveLength(51);
  });
});
```

### Component Tests

Component tests use the slot-based picker to verify that the submit button is disabled until all slots are filled and that a player cannot appear in two slots simultaneously.

```tsx
// src/components/entry/BucketPicker.test.tsx
test('submit is disabled until all buckets are filled', async () => {
  render(<BucketPicker config={fourBucketConfig} onChange={vi.fn()} />);
  expect(screen.getByRole('button', { name: /review/i })).toBeDisabled();

  await userEvent.click(screen.getByTestId('bucket-0-slot'));
  await userEvent.click(screen.getByText('Scottie Scheffler'));
  // ... fill remaining 3 buckets ...
  expect(screen.getByRole('button', { name: /review/i })).not.toBeDisabled();
});
```

### What Not to Test

- Implementation details of third-party libraries (React Router, Vite)
- CSS classes or visual styling
- Exact pixel positions or layout
- Snapshot tests of full component trees (brittle, low signal)
