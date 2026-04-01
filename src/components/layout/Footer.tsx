import type { ClubConfig } from '../../types/domain';

interface FooterProps {
  clubConfig: ClubConfig;
}

export function Footer({ clubConfig: _clubConfig }: FooterProps) {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Waldo Enterprises</p>
    </footer>
  );
}
