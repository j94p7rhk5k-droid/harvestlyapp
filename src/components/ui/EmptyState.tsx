import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Lucide icon or custom icon element */
  icon: ReactNode;
  title: string;
  description?: string;
  /** Action button / CTA slot */
  action?: ReactNode;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {/* Icon container with subtle glow */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-navy-800/60 border border-navy-700/50 flex items-center justify-center text-navy-400">
          {icon}
        </div>
        {/* Ambient glow behind icon */}
        <div className="absolute inset-0 rounded-2xl bg-brand-500/5 blur-xl -z-10" />
      </div>

      <h3 className="text-lg font-semibold text-white mb-1.5">{title}</h3>

      {description && (
        <p className="text-sm text-navy-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
