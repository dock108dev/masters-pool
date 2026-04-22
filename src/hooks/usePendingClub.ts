import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { PendingClub } from '../api/types';

interface UsePendingClubResult {
  pendingClub: PendingClub | null;
  isLoading: boolean;
}

export function usePendingClub(): UsePendingClubResult {
  const [pendingClub, setPendingClub] = useState<PendingClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getPendingClub()
      .then(setPendingClub)
      .catch((err: unknown) => {
        // 404 is already converted to null by getPendingClub(); any error here is unexpected
        console.error('[usePendingClub] Failed to fetch pending club; suppressing banner:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { pendingClub, isLoading };
}
