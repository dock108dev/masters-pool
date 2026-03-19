import type { ClubCode, ClubConfig } from '../types/domain';

export const CLUB_CONFIGS: Record<ClubCode, ClubConfig> = {
  rvcc: {
    code: 'rvcc',
    name: 'Raritan Valley Country Club',
    shortName: 'RVCC',
    pickCount: 7,
    cutMinimum: 5,
    countedScores: 5,
    useBuckets: false,
    maxEntriesPerEmail: 3,
    uploadEnabled: true,
    uploadRequired: false,
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
    bucketLabels: ['Bucket A', 'Bucket B', 'Bucket C', 'Bucket D', 'Bucket E', 'Bucket F'],
    maxEntriesPerEmail: 2,
    uploadEnabled: false,
    uploadRequired: false,
    rulesDescription: [
      'Pick 1 golfer from each of the 6 buckets.',
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
