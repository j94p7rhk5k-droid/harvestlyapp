import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ─── Variants ───────────────────────────────────────────────────────────────

const VARIANTS = {
  default: 'bg-navy-900 border border-navy-800 shadow-card',
  elevated: 'bg-navy-900 border border-navy-800 shadow-card-hover',
  glass: 'glass',
} as const;

type CardVariant = keyof typeof VARIANTS;

// ─── Props ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  /** Optional header title */
  title?: string;
  /** Optional action slot rendered in the header (right side) */
  action?: ReactNode;
  /** Disable hover animation */
  noHover?: boolean;
  onClick?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Card({
  children,
  variant = 'default',
  className,
  title,
  action,
  noHover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5',
        VARIANTS[variant],
        !noHover && 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover card-shine',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-base font-semibold text-white">{title}</h3>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
