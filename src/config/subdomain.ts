import type { ClubCode } from '../types/domain';

/**
 * Extract club code from the hostname subdomain.
 * e.g. "rvcc.localhost" → "rvcc", "rvcc.dock108.ai" → "rvcc",
 *      "crestmont.localhost" → "crestmont"
 */
export function getClubCodeFromHostname(hostname = window.location.hostname): ClubCode | null {
  const sub = hostname.split('.')[0]?.toLowerCase();
  if (sub === 'rvcc' || sub === 'crestmont') return sub;
  return null;
}
