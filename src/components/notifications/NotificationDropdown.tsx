'use client';

import { AlertTriangle, Users, Trophy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const ICON_MAP: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  overspend: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  partner_activity: { icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  goal_reached: { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-navy-900 border border-navy-800 shadow-2xl py-0 animate-scale-in origin-top-right z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-navy-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = ICON_MAP[notif.type] ?? ICON_MAP.overspend;
            const Icon = config.icon;

            return (
              <button
                key={notif.id}
                onClick={() => !notif.read && onMarkRead(notif.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-navy-800/50 border-b border-navy-800/50 last:border-0',
                  !notif.read && 'bg-brand-500/[0.03]',
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', config.bg)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-xs font-medium truncate', notif.read ? 'text-navy-400' : 'text-white')}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-navy-500 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-navy-600 mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
