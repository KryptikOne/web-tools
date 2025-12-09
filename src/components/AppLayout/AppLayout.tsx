'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import TopBar from '@/components/TopBar/TopBar';
import styles from './AppLayout.module.scss';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
