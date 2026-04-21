// Generates a deterministic standings snapshot from mock fixture data.
// Used by the nightly CI job to detect unexpected score drift between runs.
// Run with: node --experimental-strip-types scripts/export-standings.ts
import { writeFileSync } from 'node:fs';
import { MOCK_RVCC_LEADERBOARD, MOCK_CRESTMONT_LEADERBOARD } from '../src/api/mock/data.ts';

const snapshot = {
  generated_at: new Date().toISOString(),
  rvcc: MOCK_RVCC_LEADERBOARD.standings.map((s) => ({
    rank: s.rank,
    entry_name: s.entry_name,
    aggregate_score: s.aggregate_score,
    qualification_status: s.qualification_status,
  })),
  crestmont: MOCK_CRESTMONT_LEADERBOARD.standings.map((s) => ({
    rank: s.rank,
    entry_name: s.entry_name,
    aggregate_score: s.aggregate_score,
    qualification_status: s.qualification_status,
  })),
};

writeFileSync('standings-snapshot.json', JSON.stringify(snapshot, null, 2));
console.log(`Standings snapshot written (${snapshot.rvcc.length} RVCC + ${snapshot.crestmont.length} Crestmont standings).`);
