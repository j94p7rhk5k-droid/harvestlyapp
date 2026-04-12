'use client';

import { useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  currency?: string;
  className?: string;
}

// ─── Custom tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutSlice }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="text-sm font-medium text-white">{item.name}</span>
      </div>
      <p className="text-sm font-semibold text-white tabular-nums">
        {formatCurrency(item.value, currency)}
      </p>
    </div>
  );
}

// ─── Custom legend ──────────────────────────────────────────────────────────

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-navy-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom center label ────────────────────────────────────────────────────

function CenterLabel({
  viewBox,
  label,
  value,
}: {
  viewBox?: { cx: number; cy: number };
  label?: string;
  value?: string;
}) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;

  return (
    <g>
      {value && (
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-lg font-bold"
          style={{ fontSize: '18px', fontWeight: 700 }}
        >
          {value}
        </text>
      )}
      {label && (
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-navy-400 text-xs"
          style={{ fontSize: '12px' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  currency = '$',
  className,
}: DonutChartProps) {
  const renderTooltip = useCallback(
    (props: any) => <CustomTooltip {...props} currency={currency} />,
    [currency],
  );

  // Filter out zero-value slices
  const filtered = data.filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-navy-400">
        No allocation data
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            stroke="none"
          >
            {filtered.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}

            {/* Center label rendered inside the Pie via the label prop trick */}
            {(centerLabel || centerValue) && (
              <CenterLabel
                viewBox={{ cx: 0, cy: 0 }}
                label={centerLabel}
                value={centerValue}
              />
            )}
          </Pie>

          {/* Custom center text as a separate label layer */}
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="45%"
            innerRadius={0}
            outerRadius={0}
            dataKey="value"
            label={({ viewBox }) => (
              <CenterLabel
                viewBox={viewBox as { cx: number; cy: number }}
                label={centerLabel}
                value={centerValue}
              />
            )}
            isAnimationActive={false}
          />

          <Tooltip content={renderTooltip} />
          <Legend content={CustomLegend as any} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
