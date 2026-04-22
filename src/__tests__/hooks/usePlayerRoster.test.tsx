import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MockApiClient } from '../../api/mock/adapters';
import { MOCK_PLAYER_ROSTER, MOCK_TOURNAMENT_LEADERBOARD } from '../../api/mock/data';
import { usePlayerRoster } from '../../hooks/usePlayerRoster';
import { useTournamentLeaderboard } from '../../hooks/useTournamentLeaderboard';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

beforeEach(() => {
  activeClient = new MockApiClient(0);
});

describe('MockApiClient.getPlayerRoster', () => {
  it('resolves with deterministic player fixture', async () => {
    const players = await activeClient.getPlayerRoster(101);
    expect(players).toEqual(MOCK_PLAYER_ROSTER);
    expect(players[0]).toMatchObject({ id: 18417, name: 'Scottie Scheffler', worldRank: 1, tier: 'elite' });
  });

  it('each player has required fields', async () => {
    const players = await activeClient.getPlayerRoster(101);
    for (const p of players) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(['elite', 'strong', 'mid', 'longshot']).toContain(p.tier);
    }
  });

  it('returns the same fixture regardless of tournament ID', async () => {
    const a = await activeClient.getPlayerRoster(101);
    const b = await activeClient.getPlayerRoster(999);
    expect(a).toEqual(b);
  });
});

describe('MockApiClient.getLiveTournamentLeaderboard', () => {
  it('resolves with deterministic leaderboard fixture', async () => {
    const scores = await activeClient.getLiveTournamentLeaderboard(101);
    expect(scores).toEqual(MOCK_TOURNAMENT_LEADERBOARD);
    expect(scores.length).toBeGreaterThan(0);
  });

  it('each score has required fields with correct types', async () => {
    const scores = await activeClient.getLiveTournamentLeaderboard(101);
    for (const s of scores) {
      expect(typeof s.id).toBe('number');
      expect(typeof s.name).toBe('string');
      expect(['active', 'cut', 'wd']).toContain(s.status);
    }
  });

  it('active players have numeric totalStrokes and thru', async () => {
    const scores = await activeClient.getLiveTournamentLeaderboard(101);
    const active = scores.filter((s) => s.status === 'active');
    expect(active.length).toBeGreaterThan(0);
    for (const s of active) {
      expect(typeof s.totalStrokes).toBe('number');
      expect(typeof s.thru).toBe('number');
    }
  });
});

describe('usePlayerRoster', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => usePlayerRoster(101));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('resolves to player list on success', async () => {
    const { result } = renderHook(() => usePlayerRoster(101));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.players.length).toBeGreaterThan(0);
    expect(result.current.players[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      tier: expect.stringMatching(/^(elite|strong|mid|longshot)$/),
    });
    expect(result.current.error).toBeNull();
  });

  it('returns empty players and no error when tournamentId is undefined', async () => {
    const { result } = renderHook(() => usePlayerRoster(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns error state when fetch fails', async () => {
    vi.spyOn(activeClient, 'getPlayerRoster').mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => usePlayerRoster(101));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('network error');
    expect(result.current.players).toEqual([]);
  });

  it('exposes refetch function', async () => {
    const { result } = renderHook(() => usePlayerRoster(101));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useTournamentLeaderboard', () => {
  it('resolves to score list on success', async () => {
    const { result } = renderHook(() => useTournamentLeaderboard(101));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.scores.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('returns empty scores and no error when tournamentId is undefined', async () => {
    const { result } = renderHook(() => useTournamentLeaderboard(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.scores).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns error state when fetch fails', async () => {
    vi.spyOn(activeClient, 'getLiveTournamentLeaderboard').mockRejectedValue(new Error('timeout'));
    const { result } = renderHook(() => useTournamentLeaderboard(101));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('timeout');
    expect(result.current.scores).toEqual([]);
  });
});
