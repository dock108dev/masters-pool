import type { ClubConfig } from '../types/domain';

interface RulesPageProps {
  clubConfig: ClubConfig;
}

export function RulesPage({ clubConfig }: RulesPageProps) {
  return (
    <div className="page rules-page">
      <h1>How It Works</h1>
      <h2>{clubConfig.shortName} Pool Rules</h2>
      <ol className="rules-list">
        {clubConfig.rulesDescription.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ol>
      <div className="rules-details">
        <h3>Key Details</h3>
        <ul>
          <li>Pick {clubConfig.pickCount} golfers{clubConfig.useBuckets ? ' (1 from each bucket)' : ''}</li>
          <li>At least {clubConfig.cutMinimum} must make the cut to qualify</li>
          <li>Best {clubConfig.countedScores} scores are counted</li>
          {clubConfig.maxEntriesPerEmail && (
            <li>Maximum {clubConfig.maxEntriesPerEmail} entries per email</li>
          )}
        </ul>
      </div>
    </div>
  );
}
