# VFIX-002: Fix: npm error To see a list of scripts, run:

**Priority**: high
**Labels**: validation, auto-generated, test-fix
**Dependencies**: none
**Status**: implemented

## Description

Test `npm error To see a list of scripts, run:` is failing and needs to be fixed.


**Instructions:**
- Read the test to understand what it expects
- Read the implementation code at the location above
- Fix the root cause — do not modify the test unless the test itself is wrong
- Ensure the fix doesn't break other tests

## Acceptance Criteria

- [ ] Test `npm error To see a list of scripts, run:` passes
- [ ] No new test failures introduced by the fix

## Implementation Notes


Attempt 1: Fixed 4 CI-blocking issues: (1) LeaderboardPage.tsx — replaced synchronous setState(false) in useEffect with derived value to satisfy react-hooks/set-state-in-effect; (2) EntryPage.tsx + PublicEntryPage.tsx — added missing lock_time: null to PoolLockStatus fallback resolves; (3) PoolWizardPage.tsx — moved buildCreatePoolRequest and WizardState to src/utils/poolWizardUtils.ts to satisfy react-refresh/only-export-components; (4) EntryPage.test.tsx — removed unused user variable.