# ISSUE-008: Pool Creation Wizard (Coordinator UI)

**Priority**: medium
**Labels**: phase-2, frontend, pool-config
**Dependencies**: ISSUE-007, ISSUE-002
**Status**: implemented

## Description

Build a multi-step pool creation wizard for coordinators at `/:clubCode/admin/pools/new`. Steps: (1) Tournament selection, (2) Format template (flat picks vs bucketed), (3) Pick counts and bucket definitions, (4) Review & publish. On publish, `rules_json` is written and config becomes immutable. Reference: `docs/research/immutable-pool-config-pattern.md`, `docs/research/bucket-pick-format-standards.md`.

## Acceptance Criteria

- [ ] Wizard has 4 steps; step navigation is blocked if the current step has validation errors.
- [ ] Format template 'flat picks' pre-fills RVCC defaults; 'bucketed' pre-fills Crestmont defaults.
- [ ] Bucket definitions UI allows adding/removing buckets and setting min/max picks per bucket.
- [ ] Review step displays a read-only summary of all config values before publish.
- [ ] Publishing calls the backend pools endpoint; on success the coordinator is redirected to the pool's entry link.
- [ ] After publish, any attempt to revisit the wizard for the same pool redirects to a read-only config view.
- [ ] Vitest test: wizard blocks progression from step 2 to step 3 when bucket definitions are empty.
- [ ] Vitest test: submitting the wizard with flat format produces `rules_json` with no `buckets` key.

## Implementation Notes


Attempt 1: Built 4-step pool creation wizard at /:clubCode/admin/pools/new. Step 2 supports flat/bucketed format selection with auto-prefilled defaults (RVCC/Crestmont) and bucket add/remove/edit UI. Step navigation blocks on validation errors. Publish calls createPool API and redirects to entry page. Existing active pool redirects to read-only config view at /admin/pools/:poolId. Added TournamentOption, BucketDefinition, CreatePoolRules, CreatePoolRequest domain types; getTournaments and createPool to ApiClient interface with mock and HTTP implementations.