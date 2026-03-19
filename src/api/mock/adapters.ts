import type { ApiClient } from '../types';
import type { ClubCode, EntrySubmissionRequest } from '../../types/domain';
import {
  MOCK_RVCC_POOL,
  MOCK_CRESTMONT_POOL,
  MOCK_RVCC_FIELD,
  MOCK_CRESTMONT_FIELD,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockApiClient implements ApiClient {
  private latencyMs: number;

  constructor(latencyMs = 300) {
    this.latencyMs = latencyMs;
  }

  async getActivePool(clubCode: ClubCode) {
    await delay(this.latencyMs);
    if (clubCode === 'rvcc') return MOCK_RVCC_POOL;
    if (clubCode === 'crestmont') return MOCK_CRESTMONT_POOL;
    return null;
  }

  async getPoolDetail(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_POOL.id) return MOCK_CRESTMONT_POOL;
    return MOCK_RVCC_POOL;
  }

  async getPoolField(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_FIELD.pool_id) return MOCK_CRESTMONT_FIELD;
    return MOCK_RVCC_FIELD;
  }

  async submitEntry(_poolId: number, request: EntrySubmissionRequest) {
    await delay(this.latencyMs);
    return {
      entry_id: Date.now(),
      confirmationCode: `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      email: request.email,
      entry_name: request.entry_name,
      picks: request.picks,
      submittedAt: new Date().toISOString(),
    };
  }

  async getLeaderboard(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_LEADERBOARD.pool_id) return MOCK_CRESTMONT_LEADERBOARD;
    return MOCK_RVCC_LEADERBOARD;
  }

  async lookupEntries(_poolId: number, email: string) {
    await delay(this.latencyMs);
    return {
      email,
      entries: [
        {
          entry_id: 9001,
          entry_name: 'Mock Entry',
          picks: [
            { dg_id: 18417, pick_slot: 1 },
            { dg_id: 28237, pick_slot: 2 },
            { dg_id: 21209, pick_slot: 3 },
          ],
          submittedAt: '2026-04-01T10:00:00Z',
          confirmationCode: 'CONF-ABC123',
        },
      ],
    };
  }
}
