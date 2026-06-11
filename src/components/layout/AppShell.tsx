import React from 'react';
import { BackupVault } from '../ui/BackupVault';
import { Navigation5 } from '../ui/navigation-5';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vaultOpen, setVaultOpen] = React.useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(0 0% 4%)' }}>
      {/* Premium floating Navigation5 navbar */}
      <div className="fixed top-4 left-0 right-0 z-50">
        <Navigation5 onVaultOpen={() => setVaultOpen(true)} vaultOpen={vaultOpen} />
      </div>

      {/* Page content with top padding for navbar */}
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        {children}
      </main>

      <BackupVault isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
    </div>
  );
};
