import type {
  PoolSummary,
  PoolFieldResponse,
  LeaderboardData,
  LeaderboardStanding,
  LeaderboardPick,
} from '../../types/domain';

export const MOCK_RVCC_POOL: PoolSummary = {
  id: 1,
  code: 'masters-2026-rvcc',
  name: 'The Masters 2026 - RVCC Pool',
  club_code: 'rvcc',
  tournament_id: 101,
  status: 'live',
  entry_deadline: '2026-04-09T07:00:00Z',
  max_entries_per_email: 3,
  scoring_enabled: true,
  rules_json: {
    variant: 'rvcc',
    pick_count: 7,
    count_best: 5,
    min_cuts_to_qualify: 5,
    uses_buckets: false,
  },
};

export const MOCK_CRESTMONT_POOL: PoolSummary = {
  id: 2,
  code: 'masters-2026-crestmont',
  name: 'The Masters 2026 - Crestmont Pool',
  club_code: 'crestmont',
  tournament_id: 101,
  status: 'live',
  entry_deadline: '2026-04-09T07:00:00Z',
  max_entries_per_email: 2,
  scoring_enabled: true,
  rules_json: {
    variant: 'crestmont',
    pick_count: 6,
    count_best: 4,
    min_cuts_to_qualify: 4,
    uses_buckets: true,
  },
};

// Flat player list (dg_id mirrors realistic DataGolf IDs)
const flatPlayers = [
  { dg_id: 18417, player_name: 'Scottie Scheffler' },
  { dg_id: 27349, player_name: 'Xander Schauffele' },
  { dg_id: 28237, player_name: 'Rory McIlroy' },
  { dg_id: 21209, player_name: 'Jon Rahm' },
  { dg_id: 31560, player_name: 'Collin Morikawa' },
  { dg_id: 52955, player_name: 'Ludvig Aberg' },
  { dg_id: 30925, player_name: 'Wyndham Clark' },
  { dg_id: 38818, player_name: 'Viktor Hovland' },
  { dg_id: 14937, player_name: 'Brooks Koepka' },
  { dg_id: 30911, player_name: 'Patrick Cantlay' },
  { dg_id: 26302, player_name: 'Tommy Fleetwood' },
  { dg_id: 25580, player_name: 'Shane Lowry' },
  { dg_id: 13958, player_name: 'Hideki Matsuyama' },
  { dg_id: 35533, player_name: 'Sahith Theegala' },
  { dg_id: 14256, player_name: 'Tony Finau' },
  { dg_id: 33948, player_name: 'Matt Fitzpatrick' },
  { dg_id: 25396, player_name: 'Russell Henley' },
  { dg_id: 11217, player_name: 'Keegan Bradley' },
  { dg_id: 11469, player_name: 'Brian Harman' },
  { dg_id: 35450, player_name: 'Sungjae Im' },
  { dg_id: 48081, player_name: 'Min Woo Lee' },
  { dg_id: 10577, player_name: 'Jason Day' },
  { dg_id: 23983, player_name: 'Corey Conners' },
  { dg_id: 10046, player_name: 'Adam Scott' },
];

export const MOCK_RVCC_FIELD: PoolFieldResponse = {
  pool_id: 1,
  variant: 'rvcc',
  players: flatPlayers,
};

export const MOCK_CRESTMONT_FIELD: PoolFieldResponse = {
  pool_id: 2,
  variant: 'crestmont',
  buckets: [
    { bucket_number: 1, label: 'Bucket A', players: flatPlayers.slice(0, 4) },
    { bucket_number: 2, label: 'Bucket B', players: flatPlayers.slice(4, 8) },
    { bucket_number: 3, label: 'Bucket C', players: flatPlayers.slice(8, 12) },
    { bucket_number: 4, label: 'Bucket D', players: flatPlayers.slice(12, 16) },
    { bucket_number: 5, label: 'Bucket E', players: flatPlayers.slice(16, 20) },
    { bucket_number: 6, label: 'Bucket F', players: flatPlayers.slice(20, 24) },
  ],
};

function makePick(
  player: { dg_id: number; player_name: string },
  overrides: Partial<LeaderboardPick> = {}
): LeaderboardPick {
  return {
    dg_id: player.dg_id,
    player_name: player.player_name,
    total_score: -3,
    position: 10,
    thru: 18,
    r1: -2,
    r2: -1,
    r3: null,
    r4: null,
    status: 'active',
    made_cut: true,
    counts_toward_total: true,
    is_dropped: false,
    ...overrides,
  };
}

const mockRvccStandings: LeaderboardStanding[] = [
  {
    rank: 1,
    is_tied: false,
    entry_id: 1,
    entry_name: 'John Smith',
    email: 'john@example.com',
    aggregate_score: -15,
    qualification_status: 'qualified',
    qualified_golfers_count: 6,
    counted_golfers_count: 5,
    is_complete: false,
    picks: [
      makePick(flatPlayers[0], { total_score: -5, r1: -3, r2: -2 }),
      makePick(flatPlayers[2], { total_score: -4, r1: -2, r2: -2 }),
      makePick(flatPlayers[4], { total_score: -3, r1: -1, r2: -2 }),
      makePick(flatPlayers[6], { total_score: -2, r1: -1, r2: -1 }),
      makePick(flatPlayers[8], { total_score: -1, r1: 0, r2: -1 }),
      makePick(flatPlayers[10], { total_score: 2, r1: 1, r2: 1, counts_toward_total: false, is_dropped: true }),
      makePick(flatPlayers[12], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
    ],
  },
  {
    rank: 2,
    is_tied: false,
    entry_id: 2,
    entry_name: 'Jane Doe',
    email: 'jane@example.com',
    aggregate_score: -10,
    qualification_status: 'qualified',
    qualified_golfers_count: 6,
    counted_golfers_count: 5,
    is_complete: false,
    picks: [
      makePick(flatPlayers[1], { total_score: -4, r1: -2, r2: -2 }),
      makePick(flatPlayers[3], { total_score: -3, r1: -1, r2: -2 }),
      makePick(flatPlayers[5], { total_score: -2, r1: -1, r2: -1 }),
      makePick(flatPlayers[7], { total_score: -1, r1: 0, r2: -1 }),
      makePick(flatPlayers[9], { total_score: 0, r1: 0, r2: 0 }),
      makePick(flatPlayers[11], { total_score: 1, r1: 1, r2: 0, counts_toward_total: false, is_dropped: true }),
      makePick(flatPlayers[13], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'wd', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
    ],
  },
  {
    rank: null,
    is_tied: false,
    entry_id: 3,
    entry_name: 'Bob Wilson',
    email: 'bob@example.com',
    aggregate_score: null,
    qualification_status: 'not_qualified',
    qualified_golfers_count: 3,
    counted_golfers_count: 0,
    is_complete: false,
    picks: [
      makePick(flatPlayers[14], { total_score: 1, r1: 1, r2: 0 }),
      makePick(flatPlayers[15], { total_score: 3, r1: 2, r2: 1 }),
      makePick(flatPlayers[16], { total_score: 5, r1: 3, r2: 2 }),
      makePick(flatPlayers[17], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
      makePick(flatPlayers[18], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
      makePick(flatPlayers[19], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
      makePick(flatPlayers[20], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false,
      }),
    ],
  },
];

const mockCrestmontStandings: LeaderboardStanding[] = [
  {
    rank: 1,
    is_tied: false,
    entry_id: 101,
    entry_name: 'Alice Johnson',
    email: 'alice@example.com',
    aggregate_score: -12,
    qualification_status: 'qualified',
    qualified_golfers_count: 5,
    counted_golfers_count: 4,
    is_complete: false,
    picks: [
      makePick(flatPlayers[0], { total_score: -5, r1: -3, r2: -2, bucket_number: 1 }),
      makePick(flatPlayers[5], { total_score: -3, r1: -2, r2: -1, bucket_number: 2 }),
      makePick(flatPlayers[9], { total_score: -2, r1: -1, r2: -1, bucket_number: 3 }),
      makePick(flatPlayers[13], { total_score: -2, r1: -1, r2: -1, bucket_number: 4 }),
      makePick(flatPlayers[17], { total_score: 1, r1: 1, r2: 0, bucket_number: 5, counts_toward_total: false, is_dropped: true }),
      makePick(flatPlayers[21], {
        total_score: null, position: null, thru: null, r1: null, r2: null,
        status: 'cut', made_cut: false, counts_toward_total: false, is_dropped: false, bucket_number: 6,
      }),
    ],
  },
];

export const MOCK_RVCC_LEADERBOARD: LeaderboardData = {
  pool_id: 1,
  last_scored_at: '2026-04-10T14:30:00Z',
  standings: mockRvccStandings,
  count: mockRvccStandings.length,
};

export const MOCK_CRESTMONT_LEADERBOARD: LeaderboardData = {
  pool_id: 2,
  last_scored_at: '2026-04-10T14:30:00Z',
  standings: mockCrestmontStandings,
  count: mockCrestmontStandings.length,
};
