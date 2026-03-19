import type {
  TournamentSummary,
  TournamentDetail,
  AvailableGolfer,
  GolferBucket,
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardGolferCell,
} from '../../types/domain';

export const MOCK_RVCC_TOURNAMENT_SUMMARY: TournamentSummary = {
  id: 'masters-2026-rvcc',
  name: 'The Masters 2026 - RVCC Pool',
  year: 2026,
  clubCode: 'rvcc',
  status: 'active',
  startDate: '2026-04-09',
  endDate: '2026-04-12',
};

export const MOCK_CRESTMONT_TOURNAMENT_SUMMARY: TournamentSummary = {
  id: 'masters-2026-crestmont',
  name: 'The Masters 2026 - Crestmont Pool',
  year: 2026,
  clubCode: 'crestmont',
  status: 'active',
  startDate: '2026-04-09',
  endDate: '2026-04-12',
};

export const MOCK_RVCC_TOURNAMENT_DETAIL: TournamentDetail = {
  ...MOCK_RVCC_TOURNAMENT_SUMMARY,
  courseName: 'Augusta National Golf Club',
  rounds: 4,
  currentRound: 2,
  entriesCount: 48,
  entryDeadline: '2026-04-09T07:00:00Z',
};

export const MOCK_CRESTMONT_TOURNAMENT_DETAIL: TournamentDetail = {
  ...MOCK_CRESTMONT_TOURNAMENT_SUMMARY,
  courseName: 'Augusta National Golf Club',
  rounds: 4,
  currentRound: 2,
  entriesCount: 36,
  entryDeadline: '2026-04-09T07:00:00Z',
};

const golferPool: AvailableGolfer[] = [
  { id: 'g1', name: 'Scottie Scheffler', ranking: 1, country: 'USA' },
  { id: 'g2', name: 'Xander Schauffele', ranking: 2, country: 'USA' },
  { id: 'g3', name: 'Rory McIlroy', ranking: 3, country: 'NIR' },
  { id: 'g4', name: 'Jon Rahm', ranking: 4, country: 'ESP' },
  { id: 'g5', name: 'Collin Morikawa', ranking: 5, country: 'USA' },
  { id: 'g6', name: 'Ludvig Aberg', ranking: 6, country: 'SWE' },
  { id: 'g7', name: 'Wyndham Clark', ranking: 7, country: 'USA' },
  { id: 'g8', name: 'Viktor Hovland', ranking: 8, country: 'NOR' },
  { id: 'g9', name: 'Brooks Koepka', ranking: 9, country: 'USA' },
  { id: 'g10', name: 'Patrick Cantlay', ranking: 10, country: 'USA' },
  { id: 'g11', name: 'Tommy Fleetwood', ranking: 11, country: 'ENG' },
  { id: 'g12', name: 'Shane Lowry', ranking: 12, country: 'IRL' },
  { id: 'g13', name: 'Hideki Matsuyama', ranking: 13, country: 'JPN' },
  { id: 'g14', name: 'Sahith Theegala', ranking: 14, country: 'USA' },
  { id: 'g15', name: 'Tony Finau', ranking: 15, country: 'USA' },
  { id: 'g16', name: 'Matt Fitzpatrick', ranking: 16, country: 'ENG' },
  { id: 'g17', name: 'Russell Henley', ranking: 17, country: 'USA' },
  { id: 'g18', name: 'Keegan Bradley', ranking: 18, country: 'USA' },
  { id: 'g19', name: 'Brian Harman', ranking: 19, country: 'USA' },
  { id: 'g20', name: 'Sungjae Im', ranking: 20, country: 'KOR' },
  { id: 'g21', name: 'Min Woo Lee', ranking: 21, country: 'AUS' },
  { id: 'g22', name: 'Jason Day', ranking: 22, country: 'AUS' },
  { id: 'g23', name: 'Corey Conners', ranking: 23, country: 'CAN' },
  { id: 'g24', name: 'Adam Scott', ranking: 24, country: 'AUS' },
];

export const MOCK_AVAILABLE_GOLFERS: AvailableGolfer[] = golferPool;

export const MOCK_GOLFER_BUCKETS: GolferBucket[] = [
  { bucketIndex: 0, label: 'Bucket A', golfers: golferPool.slice(0, 4).map(g => ({ ...g, bucketIndex: 0 })) },
  { bucketIndex: 1, label: 'Bucket B', golfers: golferPool.slice(4, 8).map(g => ({ ...g, bucketIndex: 1 })) },
  { bucketIndex: 2, label: 'Bucket C', golfers: golferPool.slice(8, 12).map(g => ({ ...g, bucketIndex: 2 })) },
  { bucketIndex: 3, label: 'Bucket D', golfers: golferPool.slice(12, 16).map(g => ({ ...g, bucketIndex: 3 })) },
  { bucketIndex: 4, label: 'Bucket E', golfers: golferPool.slice(16, 20).map(g => ({ ...g, bucketIndex: 4 })) },
  { bucketIndex: 5, label: 'Bucket F', golfers: golferPool.slice(20, 24).map(g => ({ ...g, bucketIndex: 5 })) },
];

function makeGolferCell(golfer: AvailableGolfer, overrides: Partial<LeaderboardGolferCell> = {}): LeaderboardGolferCell {
  return {
    golferId: golfer.id,
    golferName: golfer.name,
    score: -3,
    displayScore: '-3',
    thru: 'F',
    status: 'active',
    isCounted: true,
    ...overrides,
  };
}

const mockRvccEntries: LeaderboardEntry[] = [
  {
    entryId: 'e1',
    position: 1,
    displayPosition: '1',
    entryName: 'John Smith',
    email: 'john@example.com',
    totalScore: -15,
    displayTotal: '-15',
    isQualified: true,
    qualificationNote: '5 of 7 made cut',
    countedCount: 5,
    golfers: [
      makeGolferCell(golferPool[0], { score: -5, displayScore: '-5' }),
      makeGolferCell(golferPool[2], { score: -4, displayScore: '-4' }),
      makeGolferCell(golferPool[4], { score: -3, displayScore: '-3' }),
      makeGolferCell(golferPool[6], { score: -2, displayScore: '-2' }),
      makeGolferCell(golferPool[8], { score: -1, displayScore: '-1' }),
      makeGolferCell(golferPool[10], { score: 2, displayScore: '+2', isCounted: false }),
      makeGolferCell(golferPool[12], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', isCounted: false }),
    ],
  },
  {
    entryId: 'e2',
    position: 2,
    displayPosition: '2',
    entryName: 'Jane Doe',
    email: 'jane@example.com',
    totalScore: -10,
    displayTotal: '-10',
    isQualified: true,
    qualificationNote: '6 of 7 made cut',
    countedCount: 5,
    golfers: [
      makeGolferCell(golferPool[1], { score: -4, displayScore: '-4' }),
      makeGolferCell(golferPool[3], { score: -3, displayScore: '-3' }),
      makeGolferCell(golferPool[5], { score: -2, displayScore: '-2' }),
      makeGolferCell(golferPool[7], { score: -1, displayScore: '-1' }),
      makeGolferCell(golferPool[9], { score: 0, displayScore: 'E' }),
      makeGolferCell(golferPool[11], { score: 1, displayScore: '+1', isCounted: false }),
      makeGolferCell(golferPool[13], { status: 'wd', score: null, displayScore: 'WD', thru: '-', isCounted: false }),
    ],
  },
  {
    entryId: 'e3',
    position: null,
    displayPosition: '-',
    entryName: 'Bob Wilson',
    email: 'bob@example.com',
    totalScore: null,
    displayTotal: '-',
    isQualified: false,
    qualificationNote: '3 of 7 made cut (need 5)',
    countedCount: 0,
    golfers: [
      makeGolferCell(golferPool[14], { score: 1, displayScore: '+1' }),
      makeGolferCell(golferPool[15], { score: 3, displayScore: '+3' }),
      makeGolferCell(golferPool[16], { score: 5, displayScore: '+5' }),
      makeGolferCell(golferPool[17], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', isCounted: false }),
      makeGolferCell(golferPool[18], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', isCounted: false }),
      makeGolferCell(golferPool[19], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', isCounted: false }),
      makeGolferCell(golferPool[20], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', isCounted: false }),
    ],
  },
];

const mockCrestmontEntries: LeaderboardEntry[] = [
  {
    entryId: 'ce1',
    position: 1,
    displayPosition: '1',
    entryName: 'Alice Johnson',
    email: 'alice@example.com',
    totalScore: -12,
    displayTotal: '-12',
    isQualified: true,
    qualificationNote: '5 of 6 made cut',
    countedCount: 4,
    golfers: [
      makeGolferCell(golferPool[0], { score: -5, displayScore: '-5', bucketLabel: 'Bucket A' }),
      makeGolferCell(golferPool[5], { score: -3, displayScore: '-3', bucketLabel: 'Bucket B' }),
      makeGolferCell(golferPool[9], { score: -2, displayScore: '-2', bucketLabel: 'Bucket C' }),
      makeGolferCell(golferPool[13], { score: -2, displayScore: '-2', bucketLabel: 'Bucket D' }),
      makeGolferCell(golferPool[17], { score: 1, displayScore: '+1', bucketLabel: 'Bucket E', isCounted: false }),
      makeGolferCell(golferPool[21], { status: 'cut', score: null, displayScore: 'CUT', thru: '-', bucketLabel: 'Bucket F', isCounted: false }),
    ],
  },
];

export const MOCK_RVCC_LEADERBOARD: LeaderboardData = {
  tournamentId: 'masters-2026-rvcc',
  tournamentName: 'The Masters 2026 - RVCC Pool',
  clubCode: 'rvcc',
  currentRound: 2,
  lastUpdated: '2026-04-10T14:30:00Z',
  entries: mockRvccEntries,
};

export const MOCK_CRESTMONT_LEADERBOARD: LeaderboardData = {
  tournamentId: 'masters-2026-crestmont',
  tournamentName: 'The Masters 2026 - Crestmont Pool',
  clubCode: 'crestmont',
  currentRound: 2,
  lastUpdated: '2026-04-10T14:30:00Z',
  entries: mockCrestmontEntries,
};
