'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonth } from '@/contexts/MonthContext';
import { useHouseholdView } from '@/contexts/HouseholdViewContext';
import { getMonthName, cn } from '@/lib/utils';
import { playClick, playPop } from '@/lib/sounds';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

// ─── Route → page title mapping ────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/budget': 'Budget',
  '/goals': 'Goals',
  '/transactions': 'Transactions',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === route || pathname.startsWith(route + '/')) return title;
  }
  return 'Dashboard';
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuClick: () => void;
  onAddTransaction?: () => void;
  notifications?: import('@/types').AppNotification[];
  unreadCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Header({
  onMenuClick,
  onAddTransaction,
  notifications = [],
  unreadCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HeaderProps) {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();
  const { currentMonth, nextMonth, prevMonth } = useMonth();
  const { isInHousehold, viewMode, setViewMode } = useHouseholdView();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const title = getPageTitle(pathname);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = useCallback(async () => {
    setAvatarOpen(false);
    await signOut();
  }, [signOut]);

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-navy-950/80 backdrop-blur-xl border-b border-navy-800/50">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* ── Left: Menu + Title ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-navy-400 hover:text-white hover:bg-navy-800/50 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {title}
          </h1>
        </div>

        {/* ── Center: Month selector ─────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-2 bg-navy-900/60 rounded-xl px-1.5 py-1.5 border border-navy-800/50">
          <button
            onClick={() => { prevMonth(); playPop(); }}
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white min-w-[130px] text-center tabular-nums">
            {getMonthName(currentMonth)}
          </span>
          <button
            onClick={() => { nextMonth(); playPop(); }}
            className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800/60 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Household toggle ──────────────────────────────────────────── */}
        {isInHousehold && (
          <div className="hidden sm:flex items-center bg-navy-900/60 rounded-xl p-1 border border-navy-800/50">
            <button
              onClick={() => { setViewMode('personal'); playPop(); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'personal'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-navy-400 hover:text-white',
              )}
            >
              <User className="w-3.5 h-3.5" />
              My Budget
            </button>
            <button
              onClick={() => { setViewMode('household'); playPop(); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'household'
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-navy-400 hover:text-white',
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Household
            </button>
          </div>
        )}

        {/* ── Right: Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Quick add transaction */}
          <button
            onClick={() => { onAddTransaction?.(); playClick(); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-all duration-200 shadow-glow hover:shadow-glow-lg btn-glow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add</span>
          </button>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); playClick(); }}
              className="relative p-2 rounded-xl text-navy-400 hover:text-white hover:bg-navy-800/50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={(id) => onMarkNotificationRead?.(id)}
                onMarkAllRead={() => onMarkAllNotificationsRead?.()}
              />
            )}
          </div>

          {/* User avatar dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-navy-800/50 transition-colors"
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-8 h-8 rounded-full ring-2 ring-navy-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-semibold text-white">
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-navy-400 transition-transform duration-200 hidden md:block',
                  avatarOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-navy-900 border border-navy-800 shadow-xl py-2 animate-scale-in origin-top-right">
                <div className="px-4 py-2.5 border-b border-navy-800">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.displayName}
                  </p>
                  <p className="text-xs text-navy-400 truncate">
                    {userProfile?.email}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-navy-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
