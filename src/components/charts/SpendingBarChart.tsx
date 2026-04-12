'use client';

import { useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, getCategoryColor } from '@/lib/utils';
import type { CategoryType } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SpendingItem {
  name: string;
  amount: number;
  type: CategoryType;
}

interface SpendingBarChartProps {
  data: SpendingItem[];
  currency?: string;
  maxItems?: number;
  className?: string;
}

// ─── Custom tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: SpendingItem }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-white mb-1">{item.payload.name}</p>
      <p className="text-sm font-semibold text-brand-400 tabular-nums">
        {formatCurrency(item.value, currency)}
      </p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SpendingBarChart({
  data,
  currency = '$',
  maxItems = 10,
  className,
}: SpendingBarChartProps) {
  const renderTooltip = useCallback(
    (props: any) => <CustomTooltip {...props} currency={currency} />,
    [currency],
  );

  // Sort by amount descending, take top N
  const sorted = [...data]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-navy-400">
        No spending data
      </div>
    );
  }

  // Calculate dynamic height based on item count
  const barHeight = 36;
  const chartHeight = Math.max(sorted.length * barHeight + 20, 200);

  return (
    <div className={className} style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <XAxis
            type="number"
            hide
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{
              fill: '#9fb3c8',
              fontSize: 12,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ fill: 'rgba(16, 42, 67, 0.4)' }}
          />
          <Bar
            dataKey="amount"
            radius={[0, 6, 6, 0]}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {sorted.map((entry, i) => (
              <Cell
                key={`bar-${i}`}
                fill={getCategoryColor(entry.type)}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
