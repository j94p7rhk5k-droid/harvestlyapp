'use client';

import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CashFlowRow {
  label: string;
  sign: '+' | '-' | '=';
  planned: number;
  actual: number;
  highlight?: boolean;
}

interface CashFlowTableProps {
  rollover: number;
  incomePlanned: number;
  incomeActual: number;
  expensesPlanned: number;
  expensesActual: number;
  billsPlanned: number;
  billsActual: number;
  savingsPlanned: number;
  savingsActual: number;
  debtPlanned: number;
  debtActual: number;
  currency?: string;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CashFlowTable({
  rollover,
  incomePlanned,
  incomeActual,
  expensesPlanned,
  expensesActual,
  billsPlanned,
  billsActual,
  savingsPlanned,
  savingsActual,
  debtPlanned,
  debtActual,
  currency = '$',
  className,
}: CashFlowTableProps) {
  const leftPlanned =
    rollover + incomePlanned - expensesPlanned - billsPlanned - savingsPlanned - debtPlanned;
  const leftActual =
    rollover + incomeActual - expensesActual - billsActual - savingsActual - debtActual;

  const rows: CashFlowRow[] = [
    { label: 'Rollover', sign: '+', planned: rollover, actual: rollover },
    { label: 'Income', sign: '+', planned: incomePlanned, actual: incomeActual },
    { label: 'Expenses', sign: '-', planned: expensesPlanned, actual: expensesActual },
    { label: 'Bills', sign: '-', planned: billsPlanned, actual: billsActual },
    { label: 'Savings', sign: '-', planned: savingsPlanned, actual: savingsActual },
    { label: 'Debt', sign: '-', planned: debtPlanned, actual: debtActual },
    { label: 'LEFT', sign: '=', planned: leftPlanned, actual: leftActual, highlight: true },
  ];

  return (
    <div className={cn('w-full', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-800/80">
            <th className="text-left text-xs font-medium text-navy-400 pb-3 w-8" />
            <th className="text-left text-xs font-medium text-navy-400 pb-3">
              Category
            </th>
            <th className="text-right text-xs font-medium text-navy-400 pb-3">
              Planned
            </th>
            <th className="text-right text-xs font-medium text-navy-400 pb-3">
              Actual
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={cn(
                'border-b border-navy-800/40 transition-colors',
                row.highlight
                  ? 'bg-brand-500/5 border-t-2 border-t-navy-700'
                  : 'hover:bg-navy-800/20'
              )}
            >
              {/* Sign column */}
              <td
                className={cn(
                  'py-3 pr-2 text-center font-mono text-xs',
                  row.sign === '+' ? 'text-emerald-400' : row.sign === '-' ? 'text-red-400' : 'text-brand-400'
                )}
              >
                {row.sign}
              </td>

              {/* Label */}
              <td
                className={cn(
                  'py-3',
                  row.highlight ? 'font-bold text-white' : 'text-navy-200'
                )}
              >
                {row.label}
              </td>

              {/* Planned */}
              <td
                className={cn(
                  'py-3 text-right tabular-nums',
                  row.highlight
                    ? 'font-bold text-white'
                    : 'text-navy-300'
                )}
              >
                {formatCurrency(row.planned, currency)}
              </td>

              {/* Actual */}
              <td
                className={cn(
                  'py-3 text-right tabular-nums',
                  row.highlight
                    ? row.actual >= 0
                      ? 'font-bold text-emerald-400'
                      : 'font-bold text-red-400'
                    : row.actual >= 0
                      ? 'text-navy-200'
                      : 'text-red-400'
                )}
              >
                {formatCurrency(row.actual, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
