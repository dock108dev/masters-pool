import { useApi } from './useApi';
import { apiClient } from '../api/client';
import type { PlayerScore } from '../types/domain';

export function useTournamentLeaderboard(tournamentId: number | undefined) {
  const { data, loading: isLoading, error, refetch } = useApi<PlayerScore[]>(
    () =>
      tournamentId != null
        ? apiClient.getLiveTournamentLeaderboard(tournamentId)
        : Promise.resolve([]),
    [tournamentId ?? 0],
  );
  return { scores: data ?? [], isLoading, error, refetch };
}
