'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { playPop } from '@/lib/sounds';
import {
  LayoutDashboard,
  Sprout,
  Target,
  ArrowLeftRight,
  Repeat,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Budget', href: '/budget', icon: Sprout },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Recurring', href: '/recurring', icon: Repeat },
] as const;

// ─── Props ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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

      </aside>
    </>
  );
}
