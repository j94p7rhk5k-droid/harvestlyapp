'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProgressRingProps {
  /** 0–100 percentage remaining */
  percentage: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Main value displayed in the center */
  centerValue: string;
  /** Small label underneath the center value */
  centerLabel?: string;
  /** Override the bright color (default green) */
  color?: string;
  className?: string;
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPct(Math.min(Math.max(percentage, 0), 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // The bright green arc = remaining percentage
  // It starts at the top and the dim gap grows clockwise from the top
  const brightLength = (animatedPct / 100) * circumference;
  const dimLength = circumference - brightLength;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Dim full ring (background — represents spent) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ? `${color}20` : 'rgba(34, 197, 94, 0.12)'}
          strokeWidth={strokeWidth}
        />
        {/* Bright arc — remaining */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? '#22c55e'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${brightLength} ${dimLength}`}
          strokeDashoffset={0}
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color ? `${color}40` : 'rgba(34, 197, 94, 0.3)'})`,
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
