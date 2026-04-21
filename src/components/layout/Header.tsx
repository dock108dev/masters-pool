import { Link } from 'react-router-dom';
import type { ClubConfig } from '../../types/domain';
import { LockCountdownWidget } from './LockCountdownWidget';

interface HeaderProps {
  clubConfig: ClubConfig;
  poolId?: number | null;
}

export function Header({ clubConfig, poolId }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-title">
          {clubConfig.shortName} Masters Pool
        </Link>
        {poolId != null && (
          <div className="header-lock-status">
            <LockCountdownWidget poolId={poolId} />
          </div>
        )}
        <nav className="header-nav">
          <Link to="/">Home</Link>
          {clubConfig.allowSelfServiceEntry && <Link to="/entry">Enter</Link>}
          <Link to="/leaderboard">Leaderboard</Link>
          {clubConfig.allowSelfServiceEntry && <Link to="/lookup">My Entries</Link>}
        </nav>
      </div>
    </header>
  );
}
