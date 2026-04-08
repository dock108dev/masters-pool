import { Link } from 'react-router-dom';
import type { ClubConfig } from '../../types/domain';

interface HeaderProps {
  clubConfig: ClubConfig;
}

export function Header({ clubConfig }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-title">
          {clubConfig.shortName} Masters Pool
        </Link>
        <nav className="header-nav">
          <Link to="/">Home</Link>
          {clubConfig.allowSelfServiceEntry && <Link to="/entry">Enter</Link>}
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/lookup">My Entries</Link>
        </nav>
      </div>
    </header>
  );
}
