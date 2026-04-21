import type { ClubCode } from '../types/domain';
import { isValidClubCode } from './clubs';

export type HostKind =
  | { kind: 'onboard' }
  | { kind: 'admin' }
  | { kind: 'club'; clubCode: ClubCode }
  | { kind: 'unknown'; subdomain: string };

const APEX_HOSTS = new Set([
  'countryclubpicks.com',
  'www.countryclubpicks.com',
  // legacy — handled by 301 at the edge, but classify defensively too
  'dock108.dev',
  // local dev
  'localhost',
  '127.0.0.1',
]);

/**
 * Classify the current hostname into a routing intent.
 * - apex (`countryclubpicks.com`, `www.`, bare `localhost`) → onboard
 * - `onboard.*` → onboard (legacy + local subdomain dev)
 * - `admin.*`   → admin (platform superadmin, gated at Caddy layer)
 * - `<club>.*`  → club (club-scoped public + coordinator routes)
 * - anything else → unknown
 */
export function classifyHost(hostname = window.location.hostname): HostKind {
  if (APEX_HOSTS.has(hostname)) return { kind: 'onboard' };

  const sub = hostname.split('.')[0]?.toLowerCase() ?? '';

  if (sub === 'onboard' || sub === 'www') return { kind: 'onboard' };
  if (sub === 'admin') return { kind: 'admin' };
  if (isValidClubCode(sub)) return { kind: 'club', clubCode: sub };

  return { kind: 'unknown', subdomain: sub };
}
