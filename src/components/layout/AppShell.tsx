import React, { useEffect } from 'react';
import { BackupVault } from '../ui/BackupVault';
import { Navigation5 } from '../ui/navigation-5';
import Lenis from 'lenis';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vaultOpen, setVaultOpen] = React.useState(false);

  // Buttery-smooth momentum scrolling using Lenis
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'hsl(0 0% 4%)' }}>
      <div className="w-full flex-grow">
        {/* Premium floating Navigation5 navbar */}
        <div className="fixed top-4 left-0 right-0 z-50">
          <Navigation5 onVaultOpen={() => setVaultOpen(true)} vaultOpen={vaultOpen} />
        </div>

        {/* Page content with top padding for navbar */}
        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
          {children}
        </main>
      </div>

      {/* Premium Minimal Footer */}
      <footer className="w-full border-t border-white/5 bg-neutral-950/20 py-6 text-[11px] font-mono text-neutral-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} GitSweep. All rights reserved.</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600">Created by</span>
            <a
              href="https://github.com/AbhishekS04"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors underline decoration-neutral-800 hover:decoration-neutral-400 underline-offset-4 font-semibold"
            >
              AbhishekS04
            </a>
          </div>
        </div>
      </footer>

      <BackupVault isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
    </div>
  );
};
