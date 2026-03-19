import type { ClubConfig } from '../../types/domain';

interface FooterProps {
  clubConfig: ClubConfig;
}

export function Footer({ clubConfig }: FooterProps) {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} {clubConfig.name} Masters Pool</p>
    </footer>
  );
}
