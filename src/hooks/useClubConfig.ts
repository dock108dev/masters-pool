import { useParams } from 'react-router-dom';
import { getClubConfig, isValidClubCode } from '../config/clubs';
import type { ClubConfig } from '../types/domain';

export function useClubConfig(): { clubConfig: ClubConfig | null; error: string | null } {
  const { clubCode } = useParams<{ clubCode: string }>();

  if (!clubCode || !isValidClubCode(clubCode)) {
    return { clubConfig: null, error: `Invalid club code: "${clubCode ?? ''}"` };
  }

  return { clubConfig: getClubConfig(clubCode), error: null };
}
