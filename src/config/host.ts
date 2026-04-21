import type { ClubCode } from '../types/domain';
import { isValidClubCode } from './clubs';

export type HostKind =
  | { kind: 'onboard' }
  | { kind: 'admin' }
  | { kind: 'club'; clubCode: ClubCode }
  | { kind: 'apex' }
  | { kind: 'unknown'; subdomain: string };

/**
 * Classify the current hostname into a routing intent.
 * - onboard.* → onboard (marketing + claim-your-club)
 * - admin.*   → admin (platform superadmin)
 * - <club>.*  → club (club-scoped public + coordinator routes)
 * - bare dock108.dev / localhost → apex (redirect to onboard)
 * - anything else → unknown
 */
export function classifyHost(hostname = window.location.hostname): HostKind {
  const parts = hostname.split('.').filter(Boolean);
  const sub = parts[0]?.toLowerCase() ?? '';

  // Bare localhost or bare apex domain (no subdomain).
  // "localhost" by itself is one part; "dock108.dev" is two parts with no leading subdomain.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { kind: 'apex' };
  }
  if (parts.length <= 2 && !isValidClubCode(sub) && sub !== 'onboard' && sub !== 'admin') {
    return { kind: 'apex' };
  }

  if (sub === 'onboard') return { kind: 'onboard' };
  if (sub === 'admin') return { kind: 'admin' };
  if (isValidClubCode(sub)) return { kind: 'club', clubCode: sub };

  return { kind: 'unknown', subdomain: sub };
}
