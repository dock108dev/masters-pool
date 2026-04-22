import type {
  PoolSummary,
  PoolFieldResponse,
  LeaderboardData,
  LeaderboardStanding,
  LeaderboardPick,
  TournamentOption,
  PoolEntriesResponse,
  ClubBranding,
  ClubBilling,
  ReferralInfo,
  AdminStats,
  AdminPollHealth,
  Player,
  PlayerScore,
  PlayerStatus,
} from '../../types/domain';

export const MOCK_TOURNAMENTS: TournamentOption[] = [
  { id: 101, name: 'The Masters 2026', year: 2026, cut_rule_type: 'masters', default_format: 'flat', start_date: '2026-04-09T12:00:00Z' },
  { id: 102, name: 'PGA Championship 2026', year: 2026, cut_rule_type: 'pga_championship', default_format: 'flat', start_date: '2026-05-21T12:00:00Z' },
  { id: 103, name: 'US Open 2026', year: 2026, cut_rule_type: 'us_open', default_format: 'flat', start_date: '2026-06-18T12:00:00Z' },
  { id: 104, name: 'The Open 2026', year: 2026, cut_rule_type: 'the_open', default_format: 'flat', start_date: '2026-07-16T11:00:00Z' },
  { id: 100, name: 'The Masters 2025', year: 2025, cut_rule_type: 'masters', default_format: 'flat', start_date: '2025-04-10T12:00:00Z' },
];

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
  pool_token: 'rvcc-public-entry-token-2026',
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
  pool_token: 'crestmont-public-entry-token26',
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

export const MOCK_RVCC_ENTRIES: PoolEntriesResponse = {
  pool_id: 1,
  count: 3,
  entries: [
    {
      entry_id: 1,
      entry_name: 'John Smith',
      email: 'john@example.com',
      submitted_at: '2026-04-08T10:00:00Z',
      picks: [
        { dg_id: 18417, player_name: 'Scottie Scheffler', pick_slot: 1 },
        { dg_id: 28237, player_name: 'Rory McIlroy', pick_slot: 2 },
        { dg_id: 31560, player_name: 'Collin Morikawa', pick_slot: 3 },
        { dg_id: 30925, player_name: 'Wyndham Clark', pick_slot: 4 },
        { dg_id: 14937, player_name: 'Brooks Koepka', pick_slot: 5 },
        { dg_id: 26302, player_name: 'Tommy Fleetwood', pick_slot: 6 },
        { dg_id: 13958, player_name: 'Hideki Matsuyama', pick_slot: 7 },
      ],
    },
    {
      entry_id: 2,
      entry_name: 'Jane Doe',
      email: 'jane@example.com',
      submitted_at: '2026-04-08T11:30:00Z',
      picks: [
        { dg_id: 27349, player_name: 'Xander Schauffele', pick_slot: 1 },
        { dg_id: 21209, player_name: 'Jon Rahm', pick_slot: 2 },
        { dg_id: 52955, player_name: 'Ludvig Aberg', pick_slot: 3 },
        { dg_id: 38818, player_name: 'Viktor Hovland', pick_slot: 4 },
        { dg_id: 30911, player_name: 'Patrick Cantlay', pick_slot: 5 },
        { dg_id: 25580, player_name: 'Shane Lowry', pick_slot: 6 },
        { dg_id: 35533, player_name: 'Sahith Theegala', pick_slot: 7 },
      ],
    },
    {
      entry_id: 3,
      entry_name: 'Bob Wilson',
      email: null,
      submitted_at: '2026-04-08T14:00:00Z',
      picks: [
        { dg_id: 14256, player_name: 'Tony Finau', pick_slot: 1 },
        { dg_id: 33948, player_name: 'Matt Fitzpatrick', pick_slot: 2 },
        { dg_id: 25396, player_name: 'Russell Henley', pick_slot: 3 },
        { dg_id: 11217, player_name: 'Keegan Bradley', pick_slot: 4 },
        { dg_id: 11469, player_name: 'Brian Harman', pick_slot: 5 },
        { dg_id: 35450, player_name: 'Sungjae Im', pick_slot: 6 },
        { dg_id: 48081, player_name: 'Min Woo Lee', pick_slot: 7 },
      ],
    },
  ],
};

export const MOCK_CRESTMONT_ENTRIES: PoolEntriesResponse = {
  pool_id: 2,
  count: 1,
  entries: [
    {
      entry_id: 101,
      entry_name: 'Alice Johnson',
      email: 'alice@example.com',
      submitted_at: '2026-04-08T09:00:00Z',
      picks: [
        { dg_id: 18417, player_name: 'Scottie Scheffler', pick_slot: 1, bucket_number: 1 },
        { dg_id: 52955, player_name: 'Ludvig Aberg', pick_slot: 2, bucket_number: 2 },
        { dg_id: 30911, player_name: 'Patrick Cantlay', pick_slot: 3, bucket_number: 3 },
        { dg_id: 35533, player_name: 'Sahith Theegala', pick_slot: 4, bucket_number: 4 },
        { dg_id: 11217, player_name: 'Keegan Bradley', pick_slot: 5, bucket_number: 5 },
        { dg_id: 10577, player_name: 'Jason Day', pick_slot: 6, bucket_number: 6 },
      ],
    },
  ],
};

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

// WD golfer who withdrew after R2 — total_score reflects completed rounds + penalty (backend-computed)
export const MOCK_WD_PICK_WITH_SCORE: LeaderboardPick = {
  dg_id: 27349,
  player_name: 'Xander Schauffele',
  total_score: 3,
  position: null,
  thru: null,
  r1: -1,
  r2: -2,
  r3: null,
  r4: null,
  status: 'wd',
  made_cut: false,
  counts_toward_total: false,
  is_dropped: false,
};

export const MOCK_DQ_PICK: LeaderboardPick = {
  dg_id: 28237,
  player_name: 'Rory McIlroy',
  total_score: null,
  position: null,
  thru: null,
  r1: null,
  r2: null,
  r3: null,
  r4: null,
  status: 'dq',
  made_cut: false,
  counts_toward_total: false,
  is_dropped: false,
};

export const MOCK_EMPTY_LEADERBOARD: LeaderboardData = {
  pool_id: 1,
  last_scored_at: '2026-04-09T12:00:00Z',
  standings: [],
  count: 0,
};

export const MOCK_RVCC_BRANDING: ClubBranding = {
  logo_url: null,
  primary_color: null,
  accent_color: null,
};

export const MOCK_CRESTMONT_BRANDING: ClubBranding = {
  logo_url: null,
  primary_color: null,
  accent_color: null,
};

// Pool where scoring hasn't started (pre-tournament state)
export const MOCK_PRE_TOURNAMENT_RVCC_POOL: PoolSummary = {
  ...MOCK_RVCC_POOL,
  scoring_enabled: false,
  status: 'open',
};

export const MOCK_RVCC_BILLING: ClubBilling = {
  billing_status: 'trial',
  stripe_customer_id: null,
  trial_used: false,
  next_invoice_date: null,
  billing_portal_url: null,
};

export const MOCK_CRESTMONT_BILLING: ClubBilling = {
  billing_status: 'active',
  stripe_customer_id: 'cus_mock_crestmont',
  trial_used: true,
  next_invoice_date: '2026-05-01',
  billing_portal_url: 'https://billing.stripe.com/session/mock',
};

export const MOCK_SUSPENDED_BILLING: ClubBilling = {
  billing_status: 'suspended',
  stripe_customer_id: 'cus_mock_suspended',
  trial_used: true,
  next_invoice_date: null,
  billing_portal_url: 'https://billing.stripe.com/session/mock-suspended',
};

export const MOCK_RVCC_REFERRAL: ReferralInfo = {
  referral_code: 'rvcc-ref-abc123',
  referral_url: 'https://app.example.com/ref/rvcc-ref-abc123',
  credit_balance: 0,
  referred_clubs_count: 0,
};

export const MOCK_CRESTMONT_REFERRAL: ReferralInfo = {
  referral_code: 'crestmont-ref-xyz789',
  referral_url: 'https://app.example.com/ref/crestmont-ref-xyz789',
  credit_balance: 1,
  referred_clubs_count: 1,
};

export const MOCK_ADMIN_STATS: AdminStats = {
  total_pools: 2,
  total_entries: 45,
  active_clubs: 2,
  mrr_cents: 19900,
};

export const MOCK_PLAYER_ROSTER: Player[] = [
  { id: 18417, name: 'Scottie Scheffler', worldRank: 1, tier: 'elite' },
  { id: 27349, name: 'Xander Schauffele', worldRank: 2, tier: 'elite' },
  { id: 28237, name: 'Rory McIlroy', worldRank: 3, tier: 'elite' },
  { id: 21209, name: 'Jon Rahm', worldRank: 4, tier: 'elite' },
  { id: 31560, name: 'Collin Morikawa', worldRank: 5, tier: 'elite' },
  { id: 52955, name: 'Ludvig Aberg', worldRank: 6, tier: 'elite' },
  { id: 30925, name: 'Wyndham Clark', worldRank: 7, tier: 'strong' },
  { id: 38818, name: 'Viktor Hovland', worldRank: 8, tier: 'strong' },
  { id: 14937, name: 'Brooks Koepka', worldRank: 9, tier: 'strong' },
  { id: 30911, name: 'Patrick Cantlay', worldRank: 10, tier: 'strong' },
  { id: 26302, name: 'Tommy Fleetwood', worldRank: 11, tier: 'strong' },
  { id: 25580, name: 'Shane Lowry', worldRank: 12, tier: 'strong' },
  { id: 13958, name: 'Hideki Matsuyama', worldRank: 13, tier: 'mid' },
  { id: 35533, name: 'Sahith Theegala', worldRank: 14, tier: 'mid' },
  { id: 14256, name: 'Tony Finau', worldRank: 15, tier: 'mid' },
  { id: 33948, name: 'Matt Fitzpatrick', worldRank: 16, tier: 'mid' },
  { id: 25396, name: 'Russell Henley', worldRank: 17, tier: 'mid' },
  { id: 11217, name: 'Keegan Bradley', worldRank: 18, tier: 'mid' },
  { id: 11469, name: 'Brian Harman', worldRank: 19, tier: 'longshot' },
  { id: 35450, name: 'Sungjae Im', worldRank: 20, tier: 'longshot' },
  { id: 48081, name: 'Min Woo Lee', worldRank: 21, tier: 'longshot' },
  { id: 10577, name: 'Jason Day', worldRank: 22, tier: 'longshot' },
  { id: 23983, name: 'Corey Conners', worldRank: 23, tier: 'longshot' },
  { id: 10046, name: 'Adam Scott', worldRank: 24, tier: 'longshot' },
];

export const MOCK_TOURNAMENT_LEADERBOARD: PlayerScore[] = MOCK_PLAYER_ROSTER.map(
  (p, i): PlayerScore => ({
    ...p,
    totalStrokes: i < 18 ? 280 + i : null,
    thru: i < 18 ? 18 : null,
    status: (i < 18 ? 'active' : i < 21 ? 'cut' : 'wd') as PlayerStatus,
  }),
);

export const MOCK_ADMIN_POLL_HEALTH: AdminPollHealth = {
  tournaments: [
    {
      pool_id: 1,
      pool_name: 'The Masters 2026 - RVCC Pool',
      tournament_name: 'The Masters 2026',
      last_polled_at: '2026-04-13T14:25:00Z',
      is_in_window: true,
      is_stale: false,
    },
    {
      pool_id: 2,
      pool_name: 'The Masters 2026 - Crestmont Pool',
      tournament_name: 'The Masters 2026',
      last_polled_at: '2026-04-13T14:25:00Z',
      is_in_window: true,
      is_stale: false,
    },
  ],
  checked_at: '2026-04-13T14:27:00Z',
};
