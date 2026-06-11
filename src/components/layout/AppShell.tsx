import React, { useEffect, useState } from 'react';
import { BackupVault } from '../ui/BackupVault';
import { Navigation5 } from '../ui/navigation-5';
import Lenis from 'lenis';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vaultOpen, setVaultOpen] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);

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

  // Track scroll position to fade out the bottom dissolving gradient when near the page bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollY = window.scrollY;
      
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        setIsNearBottom(true);
        return;
      }
      
      const distanceToBottom = maxScroll - scrollY;
      // Fade out when within 80px of the bottom (footer height is approx 60px)
      setIsNearBottom(distanceToBottom < 80);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();
    
    // Check again after a brief layout render to ensure accurate page measurements
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timer);
    };
  }, [children]);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'hsl(0 0% 0%)' }}>
      <div className="w-full flex-grow relative">
        {/* Top dissolving gradient mask overlay */}
        <div className="fixed top-0 left-0 right-0 h-20 sm:h-28 bg-gradient-to-b from-background via-background/90 to-transparent z-40 pointer-events-none" />

        {/* Premium floating Navigation5 navbar */}
        <div className="fixed top-4 left-0 right-0 z-50">
          <Navigation5 onVaultOpen={() => setVaultOpen(true)} vaultOpen={vaultOpen} />
        </div>

        {/* Page content with top padding for navbar */}
        <main className="max-w-6xl mx-auto px-4 pt-24 pb-8 relative z-10">
          {children}
        </main>

        {/* Bottom dissolving gradient mask overlay */}
        <div className={`fixed bottom-0 left-0 right-0 h-12 sm:h-20 bg-gradient-to-t from-background via-background/90 to-transparent z-40 pointer-events-none transition-opacity duration-300 ${
          isNearBottom ? 'opacity-0' : 'opacity-100'
        }`} />
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
