import { cn } from '../../lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu';
import { Button } from './Button';
import { Badge } from './badge';
import { Sheet, SheetContent, SheetTrigger } from './sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';
import {
  Cpu,
  Layers,
  GitBranch,
  Terminal,
  Menu,
  ArrowUpRight,
  History,
  LogOut,
  ChevronRight,
  Shield,
  LifeBuoy,
  BookOpen,
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { NotificationBell } from '../layout/NotificationBell';
import { useAuthStore } from '../../store/authStore';
import { useBackupStore } from '../../store/backupStore';
import { toast } from 'sonner';

interface Navigation5Props {
  onVaultOpen: () => void;
  vaultOpen: boolean;
}

export function Navigation5({ onVaultOpen, vaultOpen }: Navigation5Props) {
  const { user, logout } = useAuthStore();
  const { logs } = useBackupStore();

  return (
    <div className="relative w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
        {/* Floating Navbar Pill with Glassmorphism */}
        <div className="flex h-14 w-full max-w-full items-center justify-between rounded-full border border-white/10 bg-neutral-900/60 px-3 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-neutral-900/60">
          
          {/* LEFT: Logo */}
          <div className="flex-1 flex items-center justify-start pl-2">
            <div className="flex items-center gap-2 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <GithubIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white font-mono">
                GitSweep
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          {user ? (
            <div className="flex-none hidden lg:block">
              <NavigationMenu
                className={cn(
                  'static',
                  // Position the viewport wrapper relative to the navbar container
                  '[&>div:last-child]:inset-x-0 [&>div:last-child]:top-full [&>div:last-child]:w-full',
                  // Custom viewport styling for the "island" look
                  '[&_[data-slot=navigation-menu-viewport]]:mx-auto [&_[data-slot=navigation-menu-viewport]]:mt-4 [&_[data-slot=navigation-menu-viewport]]:max-w-4xl [&_[data-slot=navigation-menu-viewport]]:ring-0',
                  '[&_[data-slot=navigation-menu-viewport]]:rounded-[2rem] [&_[data-slot=navigation-menu-viewport]]:border [&_[data-slot=navigation-menu-viewport]]:border-white/10',
                  '[&_[data-slot=navigation-menu-viewport]]:bg-neutral-950/95 [&_[data-slot=navigation-menu-viewport]]:shadow-[0_20px_50px_rgba(0,0,0,0.6)] [&_[data-slot=navigation-menu-viewport]]:backdrop-blur-xl',
                  // Viewport smooth animations
                  '[&_[data-slot=navigation-menu-viewport]]:transition-all [&_[data-slot=navigation-menu-viewport]]:duration-300 [&_[data-slot=navigation-menu-viewport]]:ease-in-out',
                )}
              >
                <NavigationMenuList className="gap-1">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className="rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
                      href="#"
                    >
                      Overview
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-auto rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white focus:bg-transparent data-[state=open]:bg-white/10">
                      Operations
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0">
                      <div className="grid w-[800px] grid-cols-4 gap-6 divide-x divide-white/5 px-8 py-8 font-mono">
                        
                        {/* Column 1 */}
                        <div className="flex flex-col px-2 col-span-2">
                          <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                            <Cpu className="h-4.5 w-4.5 text-blue-400" />
                          </div>
                          <h4 className="mb-1 text-xs font-bold text-white uppercase tracking-wider">
                            Automated Cleanup
                          </h4>
                          <p className="mb-4 text-xs leading-relaxed text-neutral-400">
                            Sweep away stale branches, old PRs, and exposed secrets with customizable scheduler policies.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className="border-white/10 bg-white/5 text-[10px] text-neutral-300 rounded-full px-2.5 py-0.5"
                            >
                              <Layers className="h-3 w-3 mr-1 inline-block" />
                              Rulesets
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-white/10 bg-white/5 text-[10px] text-neutral-300 rounded-full px-2.5 py-0.5"
                            >
                              <GitBranch className="h-3 w-3 mr-1 inline-block" />
                              Branches
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-white/10 bg-white/5 text-[10px] text-neutral-300 rounded-full px-2.5 py-0.5"
                            >
                              <Shield className="h-3 w-3 mr-1 inline-block" />
                              Secrets
                            </Badge>
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-3 pl-6">
                          <h4 className="mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Backup Tools
                          </h4>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Vault Downloader
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Local Exports
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Restore points
                          </a>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col gap-3 pl-6">
                          <h4 className="mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            System API
                          </h4>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Octokit Client
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Webhooks Config
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <ChevronRight className="h-3 w-3 text-neutral-600 transition-transform group-hover:translate-x-0.5" />
                            Rate limits
                          </a>
                        </div>

                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-auto rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-400 transition-all hover:bg-white/5 hover:text-white focus:bg-transparent data-[state=open]:bg-white/10">
                      Resources
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0">
                      <div className="grid w-[800px] grid-cols-4 gap-6 divide-x divide-white/5 px-8 py-8 font-mono">
                        
                        {/* Column 1 */}
                        <div className="flex flex-col gap-3">
                          <h4 className="mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Guides
                          </h4>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-neutral-500 mr-1" />
                            Documentation
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <Terminal className="h-3.5 w-3.5 text-neutral-500 mr-1" />
                            CLI Command List
                          </a>
                          <a
                            href="#"
                            className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 group"
                          >
                            <LifeBuoy className="h-3.5 w-3.5 text-neutral-500 mr-1" />
                            Setup Tutorials
                          </a>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col gap-3 pl-6 col-span-2">
                          <h4 className="mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Featured CLI
                          </h4>
                          <a
                            href="#"
                            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/5 p-4 transition-all hover:border-white/10"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-80" />
                            <div className="absolute inset-0 bg-neutral-900/50" />

                            <div className="relative z-10">
                              <Badge
                                variant="outline"
                                className="mb-2 border-blue-500/30 bg-blue-500/10 text-[9px] text-blue-400 rounded-full px-2 py-0.5"
                              >
                                GitSweep CLI v2
                              </Badge>
                              <h4 className="mb-1 text-xs font-bold text-white leading-tight">
                                Run sweeps from your terminal
                              </h4>
                              <p className="text-[10px] text-neutral-400 leading-snug">
                                Integrate seamlessly with your CI/CD workflows and run custom cleanup scripts directly on your local system.
                              </p>
                            </div>

                            <div className="relative z-10 mt-3 flex items-center text-[10px] font-bold text-blue-400">
                              View CLI Guide{' '}
                              <ArrowUpRight className="ml-0.5 size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                          </a>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col gap-3 pl-6">
                          <h4 className="mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Status
                          </h4>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-neutral-400">GitHub API</span>
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                              Operational
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] text-neutral-400">Backups status</span>
                            <span className="text-[10px] font-bold text-blue-400">
                              {logs.length} restore points
                            </span>
                          </div>
                        </div>

                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          ) : (
            <div className="flex-none hidden lg:block" />
          )}

          {/* RIGHT: Action Icons & Profile Section */}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-2">

            {user ? (
              <>
                <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 mr-1.5">
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
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/5"
                      >
                        <Menu className="size-4.5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="flex w-[290px] flex-col gap-5 border-white/10 bg-neutral-950 p-5 font-mono text-neutral-200"
                    >
                      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/10">
                          <GithubIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-base font-bold text-white font-mono">
                          GitSweep
                        </span>
                      </div>

                      {/* Navigation Content */}
                      <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-1">
                        <a
                          href="#"
                          className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors py-1"
                        >
                          Overview
                        </a>

                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="operations" className="border-white/5">
                            <AccordionTrigger className="justify-between py-1 text-sm font-semibold text-neutral-300 hover:text-white hover:no-underline">
                              Operations
                            </AccordionTrigger>
                            <AccordionContent className="mt-2 ml-2 flex flex-col gap-2 border-l border-white/5 pb-0 pl-3 text-xs">
                              <span className="text-[10px] text-neutral-500 uppercase tracking-wider pt-1">
                                Automated Cleanup
                              </span>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Rulesets</a>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Branches Sweep</a>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Exposed Secrets</a>

                              <span className="text-[10px] text-neutral-500 uppercase tracking-wider pt-2">
                                Backups
                              </span>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Vault Downloader</a>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Local Exports</a>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="resources" className="border-white/5">
                            <AccordionTrigger className="justify-between py-1 text-sm font-semibold text-neutral-300 hover:text-white hover:no-underline">
                              Resources
                            </AccordionTrigger>
                            <AccordionContent className="mt-2 ml-2 flex flex-col gap-2 border-l border-white/5 pb-0 pl-3 text-xs">
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">Documentation</a>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">CLI Guide</a>
                              <a href="#" className="text-neutral-400 hover:text-white py-0.5">API Rate Limits</a>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>

                      {/* Profile & Logout Section at bottom */}
                      <div className="mt-auto border-t border-white/5 pt-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.login}
                            className="h-8 w-8 rounded-full ring-2 ring-white/10"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                              {user.login}
                            </span>
                            <span className="text-[9px] text-neutral-400">
                              @{user.login}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            logout();
                            toast.success('Logged out successfully');
                          }}
                          className="w-full h-9 rounded-full bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-bold uppercase tracking-wider transition-all border border-red-500/20"
                        >
                          <LogOut className="h-3.5 w-3.5 mr-1.5 inline-block" />
                          Sign Out
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
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
