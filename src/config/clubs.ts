import type { ClubCode, ClubConfig } from '../types/domain';

// ClubConfig provides UI-specific configuration for each club.
// Scoring rules (pick_count, count_best, min_cuts_to_qualify, uses_buckets) are
// authoritative on the backend via pool.rules_json; these frontend values are used
// for UI rendering and client-side validation only.
export const CLUB_CONFIGS: Record<ClubCode, ClubConfig> = {
  rvcc: {
    code: 'rvcc',
    name: 'Raritan Valley Country Club',
    shortName: 'RVCC',
    pickCount: 7,
    cutMinimum: 5,
    countedScores: 5,
    useBuckets: false,
    allowSelfServiceEntry: true,
    maxEntriesPerEmail: 3,
    rulesDescription: [
      'Pick any 7 golfers from the field.',
      'At least 5 of your golfers must make the cut to qualify.',
      'Your best 5 scores are counted toward your total.',
      'If more than 5 make the cut, the 2 highest scores are dropped.',
      'Lowest aggregate counted score wins.',
    ],
  },
  crestmont: {
    code: 'crestmont',
    name: 'Crestmont Country Club',
    shortName: 'Crestmont',
    pickCount: 6,
    cutMinimum: 4,
    countedScores: 4,
    useBuckets: true,
    bucketLabels: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'],
    allowSelfServiceEntry: false,
    maxEntriesPerEmail: 2,
    rulesDescription: [
      '$30 per entry — billed to member accounts.',
      'Pick 1 golfer from each of the 6 groups.',
      'At least 4 of your golfers must make the cut to qualify.',
      'Your best 4 scores are counted toward your total.',
      'Lowest aggregate counted score wins.',
    ],
  },
};

export function getClubConfig(code: ClubCode): ClubConfig {
  return CLUB_CONFIGS[code];
}

export function isValidClubCode(code: string): code is ClubCode {
  return code === 'rvcc' || code === 'crestmont';
}
