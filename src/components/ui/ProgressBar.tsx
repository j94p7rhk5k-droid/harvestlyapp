import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  /** Progress value from 0 to 100 (can exceed 100 for over-budget) */
  value: number;
  /** Optional fixed color override (tailwind bg class). Auto-colors if omitted. */
  color?: string;
  /** Label displayed on the left */
  label?: string;
  /** Show percentage on the right */
  showPercentage?: boolean;
  /** Thin (h-1.5) or thick (h-3) bar */
  variant?: 'thin' | 'thick';
  className?: string;
}

// ─── Auto color helper ──────────────────────────────────────────────────────

function getAutoColor(value: number): string {
  if (value > 100) return 'bg-red-500';
  if (value >= 80) return 'bg-amber-500';
  return 'bg-brand-500';
}

function getAutoGlow(value: number): string {
  if (value > 100) return 'shadow-[0_0_8px_rgba(239,68,68,0.4)]';
  if (value >= 80) return 'shadow-[0_0_8px_rgba(245,158,11,0.3)]';
  return 'shadow-[0_0_8px_rgba(42,157,115,0.3)]';
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProgressBar({
  value,
  color,
  label,
  showPercentage = true,
  variant = 'thick',
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, value);
  const displayWidth = Math.min(clamped, 100);
  const barColor = color ?? getAutoColor(clamped);
  const glow = getAutoGlow(clamped);

  return (
    <div className={cn('w-full', className)}>
      {/* Label + percentage row */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-navy-300">{label}</span>
          )}
          {showPercentage && (
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                clamped > 100
                  ? 'text-red-400'
                  : clamped >= 80
                    ? 'text-amber-400'
                    : 'text-navy-300'
              )}
            >
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      {/* Bar track */}
      <div
        className={cn(
          'w-full rounded-full bg-navy-800/60 overflow-hidden',
          variant === 'thin' ? 'h-1.5' : 'h-3'
        )}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out animate-progress-fill',
            barColor,
            glow
          )}
          style={{ width: `${displayWidth}%` }}
        />
      </div>
    </div>
  );
}
