import { useApi } from './useApi';
import { apiClient } from '../api/client';
import type { Player } from '../types/domain';

export function usePlayerRoster(tournamentId: number | undefined) {
  const { data, loading: isLoading, error, refetch } = useApi<Player[]>(
    () =>
      tournamentId != null
        ? apiClient.getPlayerRoster(tournamentId)
        : Promise.resolve([]),
    [tournamentId ?? 0],
  );
  return { players: data ?? [], isLoading, error, refetch };
}
