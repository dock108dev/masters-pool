import { useOutletContext } from 'react-router-dom';
import type { ClubConfig } from '../types/domain';

interface ClubOutletContext {
  clubConfig: ClubConfig;
}

export function useClubOutletContext(): ClubOutletContext {
  return useOutletContext<ClubOutletContext>();
}
