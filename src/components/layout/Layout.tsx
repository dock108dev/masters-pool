import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import type { ClubConfig } from '../../types/domain';

interface LayoutProps {
  clubConfig: ClubConfig;
  children: ReactNode;
}

export function Layout({ clubConfig, children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Header clubConfig={clubConfig} />
      <main className="main-content">{children}</main>
      <Footer clubConfig={clubConfig} />
    </div>
  );
}
