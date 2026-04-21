import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import type { ClubConfig } from '../../types/domain';

interface LayoutProps {
  clubConfig: ClubConfig;
  children: ReactNode;
  poolId?: number | null;
}

export function Layout({ clubConfig, children, poolId }: LayoutProps) {
  return (
    <div className="app-layout" data-club={clubConfig.code}>
      <Header clubConfig={clubConfig} poolId={poolId} />
      <main className="main-content">{children}</main>
      <Footer clubConfig={clubConfig} />
    </div>
  );
}
