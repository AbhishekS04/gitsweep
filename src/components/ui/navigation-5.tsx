import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import {
  Menu,
  History,
  LogOut,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { NotificationBell } from '../layout/NotificationBell';
import { useAuthStore } from '../../store/authStore';
import { useBackupStore } from '../../store/backupStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Navigation5Props {
  onVaultOpen: () => void;
  vaultOpen: boolean;
}

export function Navigation5({ onVaultOpen, vaultOpen }: Navigation5Props) {
  const { user, logout } = useAuthStore();
  const { logs } = useBackupStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      gsap.killTweensOf([menuRef.current, backdropRef.current]);
      
      gsap.set(backdropRef.current, { display: 'block', opacity: 0 });
      gsap.set(menuRef.current, { display: 'flex', opacity: 0, y: -20, scale: 0.95 });

      gsap.to(backdropRef.current, {
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out'
      });

      gsap.to(menuRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: 'back.out(1.2)'
      });
    } else {
      gsap.killTweensOf([menuRef.current, backdropRef.current]);
      
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(backdropRef.current, { display: 'none' });
        }
      });

      gsap.to(menuRef.current, {
        opacity: 0,
        y: -15,
        scale: 0.95,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(menuRef.current, { display: 'none' });
        }
      });
    }
  }, [mobileMenuOpen]);

  return (
    <div className="relative w-full">
      {/* Backdrop overlay */}
      <div
        ref={backdropRef}
        onClick={() => setMobileMenuOpen(false)}
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        style={{ display: 'none' }}
      />
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 relative z-50">
        {/* Floating Navbar Pill with Glassmorphism */}
        <div className="flex h-14 w-full max-w-full items-center justify-between rounded-full border border-white/10 bg-neutral-900/60 px-3 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-neutral-900/60 relative z-50">
          
          {/* LEFT: Logo */}
          <div className="flex-1 flex items-center justify-start pl-2">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 select-none cursor-pointer group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-200">
                <GithubIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white font-mono group-hover:text-neutral-200 transition-colors duration-200">
                GitSweep
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {/* RIGHT: Action Icons & Profile Section */}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-2">

            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-1.5 pr-2 border-r border-white/10 mr-1.5">
                  {/* Backup Vault Trigger */}
                  <button
                    onClick={onVaultOpen}
                    title="Backup Vault"
                    className={cn(
                      "relative p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer border-none bg-transparent focus:outline-none",
                      vaultOpen && "text-white bg-white/5"
                    )}
                  >
                    <History className="h-4 w-4" />
                    {logs.length > 0 && !vaultOpen && (
                      <span className="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-neutral-900 animate-pulse" />
                    )}
                  </button>

                  {/* Notification Bell */}
                  <NotificationBell />
                </div>

                {/* Profile Controls */}
                <div className="hidden items-center gap-3 md:flex pl-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="h-7 w-7 rounded-full ring-2 ring-white/10"
                    />
                    <div className="flex flex-col select-none">
                      <span className="text-xs font-semibold text-white leading-none">
                        {user.login}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 leading-none mt-1">
                        @{user.login}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      logout();
                      toast.success('Logged out successfully');
                    }}
                    title="Sign out"
                    className="h-8 w-8 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all duration-200"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Mobile Menu Trigger */}
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(v => !v)}
                    className="h-9 w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 relative z-50 cursor-pointer"
                  >
                    <Menu className="size-4.5" />
                  </Button>

                  {/* Dropdown panel */}
                  <div
                    ref={menuRef}
                    className="absolute top-16 left-4 right-4 z-50 rounded-2xl border border-white/10 bg-neutral-950/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex-col gap-4 font-mono text-neutral-200"
                    style={{ display: 'none' }}
                  >
                    {/* Navigation Content */}
                    <div className="flex items-center justify-end">
                      <div className="flex items-center gap-1">
                        {/* Backup Vault Trigger */}
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onVaultOpen();
                          }}
                          title="Backup Vault"
                          className={cn(
                            "relative p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer border-none bg-transparent focus:outline-none",
                            vaultOpen && "text-white bg-white/5"
                          )}
                        >
                          <History className="h-4 w-4" />
                          {logs.length > 0 && !vaultOpen && (
                            <span className="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-neutral-900 animate-pulse" />
                          )}
                        </button>

                        {/* Notification Bell */}
                        <NotificationBell />
                      </div>
                    </div>

                    {/* Profile & Logout Section at bottom */}
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-3 px-1">
                        <img
                          src={user.avatar_url}
                          alt={user.login}
                          className="h-8 w-8 rounded-full ring-2 ring-white/10"
                        />
                        <div className="flex flex-col select-none">
                          <span className="text-xs font-semibold text-white leading-none">
                            {user.login}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 leading-none mt-1">
                            @{user.login}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                          toast.success('Logged out successfully');
                        }}
                        className="w-full h-9 rounded-full bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-bold uppercase tracking-wider transition-all border border-red-500/20"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-1.5 inline-block" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <a
                href="/login"
                className="hidden rounded-full bg-white px-5 py-1.5 text-xs font-bold text-neutral-900 transition-all hover:bg-neutral-200 md:block dark:bg-white dark:text-neutral-900"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
          
        </div>
      </div>
    </div>
  );
}
