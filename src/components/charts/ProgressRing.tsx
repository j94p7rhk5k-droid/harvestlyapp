'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProgressRingProps {
  /** 0–100 percentage */
  percentage: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Main value displayed in the center */
  centerValue: string;
  /** Small label underneath the center value */
  centerLabel?: string;
  /** Override the color (otherwise auto green/yellow/red) */
  color?: string;
  className?: string;
}

// ─── Color logic ────────────────────────────────────────────────────────────

/** Color based on how much is remaining (high = green, low = red) */
function getStrokeColor(remainingPct: number): string {
  if (remainingPct <= 0) return '#ef4444';   // red — overspent
  if (remainingPct <= 20) return '#f59e0b';  // amber — almost gone
  if (remainingPct <= 40) return '#eab308';  // yellow — getting low
  return '#22c55e';                           // green — plenty left
}

function getGlowColor(remainingPct: number): string {
  if (remainingPct <= 0) return 'rgba(239,68,68,0.3)';
  if (remainingPct <= 20) return 'rgba(245,158,11,0.25)';
  if (remainingPct <= 40) return 'rgba(234,179,8,0.2)';
  return 'rgba(34,197,94,0.25)';
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProgressRing({
  percentage,
  size = 160,
  strokeWidth = 10,
  centerValue,
  centerLabel,
  color,
  className,
}: ProgressRingProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  // Animate in on mount / value change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPct(Math.min(percentage, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const strokeColor = color ?? getStrokeColor(percentage);
  const glowColor = color ? `${color}40` : getGlowColor(percentage);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-90 scale-x-100"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(16, 42, 67, 0.6)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white tabular-nums">
          {centerValue}
        </span>
        {centerLabel && (
          <span className="text-xs text-navy-400 mt-0.5">{centerLabel}</span>
        )}
      </div>
    </div>
  );
}
