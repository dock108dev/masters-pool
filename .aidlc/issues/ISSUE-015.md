# ISSUE-015: Transactional Email Notifications

**Priority**: medium
**Labels**: phase-3, backend, entry
**Dependencies**: ISSUE-009, ISSUE-006
**Status**: implemented

## Description

Implement opt-in email notifications triggered by entry and pool lifecycle events. Three notification types: (1) entry confirmation email to the entrant (contains pick list and lock time), (2) pool lock email to all entrants who provided an address (confirms picks are saved), (3) coordinator notification when pool auto-locks (includes entry count). Email delivery via Resend or Postmark, injected via env vars. Non-blocking — delivery failures are logged but do not fail the triggering operation. Reference: ISSUE-006 for the `entry_events` table that drives triggers, ISSUE-009 for optional email capture at entry.

## Acceptance Criteria

- [ ] Entry confirmation email is sent when `picks_submitted` event fires and `entry.email` is non-null; email contains entrant name, full pick list, and formatted lock time.
- [ ] Pool lock email is sent to all entries with a non-null email when `pool_locked` event fires; contains the entry's pick summary and lock timestamp.
- [ ] Coordinator receives a pool lock notification email listing entry count and pool name when auto-lock completes.
- [ ] Email provider (Resend or Postmark) is selected via `EMAIL_PROVIDER` env var (`resend` | `postmark`); API key via `EMAIL_API_KEY` — no provider hardcoded.
- [ ] If email delivery throws or returns a non-2xx, the error is logged to the audit trail but the originating operation (entry submit or lock) still returns success.
- [ ] No email is sent when `entry.email` is null — opt-in is enforced at the send site, not caller.
- [ ] Vitest test: `sendEntryConfirmation` is not called when entry has no email address.
- [ ] Vitest test: email send failure does not cause `POST /entries` to return a 5xx — entry is still persisted.
- [ ] Integration test: `POST /entries` with a valid email enqueues exactly one confirmation email send.

## Implementation Notes


Attempt 1: Added transactional email notifications via src/ingestion/email.ts: EmailProvider interface with ResendEmailProvider and PostmarkEmailProvider implementations, createEmailProvider() factory (provider/key from env vars), EmailNotificationService with sendEntryConfirmation (no-op on null email, catches delivery failures), sendPoolLockEmail, sendCoordinatorLockEmail, and handleEntrySubmission() coordinator function. Added email_delivery_failed PoolEventType to domain.ts. Exported all from ingestion/index.ts. 36 tests covering all acceptance criteria in src/__tests__/ingestion/email.test.ts.