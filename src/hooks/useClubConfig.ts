import { getClubConfig, isValidClubCode } from '../config/clubs';
import { getClubCodeFromHostname } from '../config/subdomain';
import type { ClubConfig } from '../types/domain';

export function useClubConfig(): { clubConfig: ClubConfig | null; error: string | null } {
  const clubCode = getClubCodeFromHostname();

  if (!clubCode || !isValidClubCode(clubCode)) {
    return { clubConfig: null, error: `Unknown site. Expected rvcc.localhost or crestmont.localhost.` };
  }

  return { clubConfig: getClubConfig(clubCode), error: null };
}
