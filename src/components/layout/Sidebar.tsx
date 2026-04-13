'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { playPop } from '@/lib/sounds';
import {
  LayoutDashboard,
  Sprout,
  Target,
  ArrowLeftRight,
  Repeat,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ─── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Budget', href: '/budget', icon: Sprout },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Recurring', href: '/recurring', icon: Repeat },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

// ─── Props ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-backdrop-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col',
          'bg-navy-950',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 h-[72px] border-b border-navy-800/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img
              src="/favicon.png"
              alt="Harvestly"
              className="w-9 h-9 rounded-xl shadow-glow group-hover:shadow-glow-lg transition-shadow"
            />
            <span className="text-xl font-bold gradient-text-accent tracking-tight">
              Harvestly
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-navy-800/60 text-navy-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                onClick={() => { onClose(); playPop(); }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 shadow-sm'
                    : 'text-navy-300 hover:text-white hover:bg-navy-800/50'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-brand-400' : 'text-navy-500'
                  )}
                />
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User profile + Sign out ──────────────────────────────────────── */}
        <div className="px-3 pb-4 mt-auto border-t border-navy-800/50 pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-9 h-9 rounded-full ring-2 ring-navy-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-semibold text-white">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.displayName ?? 'User'}
              </p>
              <p className="text-xs text-navy-400 truncate">
                {userProfile?.email ?? ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
