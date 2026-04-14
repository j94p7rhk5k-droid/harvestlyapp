import type { RecurrenceFrequency } from '@/types';

/**
 * Calculate all occurrence dates for a recurring transaction within a given month.
 *
 * @param startDate - The original transaction date (YYYY-MM-DD) — used to determine
 *                    the day-of-week for weekly/biweekly, or day-of-month for monthly.
 * @param frequency - How often it recurs.
 * @param targetMonth - The month to generate dates for (YYYY-MM).
 * @returns Array of ISO date strings (YYYY-MM-DD) for each occurrence in the target month.
 */
export function getRecurringDatesInMonth(
  startDate: string,
  frequency: RecurrenceFrequency | undefined,
  targetMonth: string,
): string[] {
  const freq = frequency ?? 'monthly';
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
  const lastDay = new Date(year, month + 1, 0).getDate();

  const startParts = startDate.split('-');
  const startDay = parseInt(startParts[2] ?? '1', 10);

  switch (freq) {
    case 'weekly': {
      // Same day of week, every week in the month
      const startObj = new Date(startDate);
      const dayOfWeek = startObj.getDay(); // 0=Sun, 1=Mon, etc.

      // Find the first occurrence of that day in the target month
      const first = new Date(year, month, 1);
      let firstOccurrence = 1 + ((dayOfWeek - first.getDay() + 7) % 7);

      const dates: string[] = [];
      let day = firstOccurrence;
      while (day <= lastDay) {
        dates.push(`${targetMonth}-${String(day).padStart(2, '0')}`);
        day += 7;
      }
      return dates;
    }

    case 'biweekly': {
      // Every 2 weeks — same day of week
      const startObj = new Date(startDate);
      const dayOfWeek = startObj.getDay();

      // Find first occurrence of that day in the target month
      const first = new Date(year, month, 1);
      let firstOccurrence = 1 + ((dayOfWeek - first.getDay() + 7) % 7);

      // Determine which weeks align with the bi-weekly cadence
      // Count weeks from the start date to find the right offset
      const startMs = startObj.getTime();
      const firstOfMonth = new Date(year, month, firstOccurrence).getTime();
      const weeksDiff = Math.round((firstOfMonth - startMs) / (7 * 86400000));
      const isEvenWeek = weeksDiff % 2 === 0;

      // If first occurrence doesn't align, shift by one week
      if (!isEvenWeek) {
        firstOccurrence += 7;
      }

      const dates: string[] = [];
      let day = firstOccurrence;
      while (day <= lastDay) {
        dates.push(`${targetMonth}-${String(day).padStart(2, '0')}`);
        day += 14;
      }

      // Bi-weekly should have at least 2 occurrences most months
      // If we only got 1 due to alignment, check if there's room for another
      if (dates.length === 1 && firstOccurrence > 7) {
        // Try starting a week earlier
        const altStart = firstOccurrence - 14;
        if (altStart >= 1) {
          dates.unshift(`${targetMonth}-${String(altStart).padStart(2, '0')}`);
        }
      }

      return dates.length > 0 ? dates : [`${targetMonth}-${String(Math.min(startDay, lastDay)).padStart(2, '0')}`];
    }

    case 'semimonthly': {
      // Twice a month — common payroll cadence (e.g. 1st/15th, 15th/last day).
      // First date = startDay; second date ≈ 15 days later, clamped to the
      // end of the month. If the first day is already so late that adding 15
      // would overflow, use the last day of the month as the second date.
      const day1 = Math.min(startDay, lastDay);
      let day2 = day1 + 15;
      if (day2 > lastDay) day2 = lastDay;
      if (day2 === day1) {
        return [`${targetMonth}-${String(day1).padStart(2, '0')}`];
      }
      return [
        `${targetMonth}-${String(day1).padStart(2, '0')}`,
        `${targetMonth}-${String(day2).padStart(2, '0')}`,
      ];
    }

    case 'monthly': {
      const day = Math.min(startDay, lastDay);
      return [`${targetMonth}-${String(day).padStart(2, '0')}`];
    }

    case 'quarterly': {
      // Only occurs in months that are 0, 3, 6, or 9 months from the start month
      const startMonth = parseInt(startParts[1] ?? '1', 10);
      const diff = ((month + 1) - startMonth + 12) % 12;
      if (diff % 3 === 0) {
        const day = Math.min(startDay, lastDay);
        return [`${targetMonth}-${String(day).padStart(2, '0')}`];
      }
      return [];
    }

    case 'yearly': {
      const startMonth = parseInt(startParts[1] ?? '1', 10);
      if (month + 1 === startMonth) {
        const day = Math.min(startDay, lastDay);
        return [`${targetMonth}-${String(day).padStart(2, '0')}`];
      }
      return [];
    }

    default:
      return [`${targetMonth}-${String(Math.min(startDay, lastDay)).padStart(2, '0')}`];
  }
}

/**
 * Get the estimated number of occurrences per month for a given frequency.
 */
export function getMonthlyOccurrences(frequency: RecurrenceFrequency | undefined): number {
  switch (frequency ?? 'monthly') {
    case 'weekly': return 4;
    case 'biweekly': return 2;
    case 'semimonthly': return 2;
    case 'monthly': return 1;
    case 'quarterly': return 1 / 3;
    case 'yearly': return 1 / 12;
    default: return 1;
  }
}
