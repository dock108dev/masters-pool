import { Link } from 'react-router-dom';
import type { ClubConfig } from '../../types/domain';

interface HeaderProps {
  clubConfig: ClubConfig;
}

export function Header({ clubConfig }: HeaderProps) {
  const base = `/${clubConfig.code}`;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to={base} className="header-title">
          {clubConfig.shortName} Masters Pool
        </Link>
        <nav className="header-nav">
          <Link to={base}>Home</Link>
          <Link to={`${base}/rules`}>Rules</Link>
          <Link to={`${base}/entry`}>Enter</Link>
          <Link to={`${base}/leaderboard`}>Leaderboard</Link>
          <Link to={`${base}/lookup`}>My Entries</Link>
        </nav>
      </div>
    </header>
  );
}
