import type { ApiClient } from '../types';
import type { ClubCode } from '../../types/domain';
import {
  MOCK_RVCC_TOURNAMENT_SUMMARY,
  MOCK_CRESTMONT_TOURNAMENT_SUMMARY,
  MOCK_RVCC_TOURNAMENT_DETAIL,
  MOCK_CRESTMONT_TOURNAMENT_DETAIL,
  MOCK_AVAILABLE_GOLFERS,
  MOCK_GOLFER_BUCKETS,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockApiClient implements ApiClient {
  private latencyMs: number;

  constructor(latencyMs = 300) {
    this.latencyMs = latencyMs;
  }

  async getActiveTournament(clubCode: ClubCode) {
    await delay(this.latencyMs);
    if (clubCode === 'rvcc') return MOCK_RVCC_TOURNAMENT_SUMMARY;
    if (clubCode === 'crestmont') return MOCK_CRESTMONT_TOURNAMENT_SUMMARY;
    return null;
  }

  async getTournamentDetail(tournamentId: string) {
    await delay(this.latencyMs);
    if (tournamentId.includes('crestmont')) return MOCK_CRESTMONT_TOURNAMENT_DETAIL;
    return MOCK_RVCC_TOURNAMENT_DETAIL;
  }

  async getAvailableGolfers(_tournamentId: string) {
    await delay(this.latencyMs);
    return MOCK_AVAILABLE_GOLFERS;
  }

  async getGolferBuckets(_tournamentId: string) {
    await delay(this.latencyMs);
    return MOCK_GOLFER_BUCKETS;
  }

  async submitEntry(request: Parameters<ApiClient['submitEntry']>[0]) {
    await delay(this.latencyMs);
    const golferNames = MOCK_AVAILABLE_GOLFERS
      .filter((g) => request.golferIds.includes(g.id))
      .map((g) => g.name);

    return {
      entryId: `entry-${Date.now()}`,
      confirmationCode: `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      email: request.email,
      displayName: request.displayName,
      golferNames,
      submittedAt: new Date().toISOString(),
    };
  }

  async getLeaderboard(tournamentId: string) {
    await delay(this.latencyMs);
    if (tournamentId.includes('crestmont')) return MOCK_CRESTMONT_LEADERBOARD;
    return MOCK_RVCC_LEADERBOARD;
  }

  async lookupEntries(_clubCode: ClubCode, email: string) {
    await delay(this.latencyMs);
    return {
      email,
      entries: [
        {
          entryId: 'entry-mock-1',
          displayName: 'Mock Entry',
          golferNames: ['Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm'],
          submittedAt: '2026-04-01T10:00:00Z',
          confirmationCode: 'CONF-ABC123',
        },
      ],
    };
  }

  async uploadFile(_file: File, _entryId: string) {
    await delay(this.latencyMs);
    return { url: 'https://placeholder.example.com/uploads/mock-file' };
  }
}
