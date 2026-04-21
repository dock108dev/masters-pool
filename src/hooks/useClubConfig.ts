import { getClubConfig } from '../config/clubs';
import { classifyHost } from '../config/host';
import type { ClubConfig } from '../types/domain';

export function useClubConfig(): { clubConfig: ClubConfig | null; error: string | null } {
  const host = classifyHost();

  if (host.kind === 'club') {
    return { clubConfig: getClubConfig(host.clubCode), error: null };
  }

  // Non-club hosts (onboard/admin/apex/unknown) should not be rendering club UI,
  // but surface a clear error if they somehow get here.
  return {
    clubConfig: null,
    error: 'Unknown site. Expected rvcc.localhost or crestmont.localhost.',
  };
}
