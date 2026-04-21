import type { ClubCode } from '../types/domain';
import { classifyHost } from './host';

/**
 * Extract club code from the hostname subdomain.
 * Returns null for non-club hosts (onboard, admin, apex, unknown).
 */
export function getClubCodeFromHostname(hostname = window.location.hostname): ClubCode | null {
  const host = classifyHost(hostname);
  return host.kind === 'club' ? host.clubCode : null;
}
