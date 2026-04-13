export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

/**
 * Parse a CSV string from a bank/credit card export into structured rows.
 * Handles common formats: Date, Description, Amount (or Debit/Credit columns).
 */
export function parseCSV(text: string): string {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return text; // Not enough data, return as-is for Claude

  // Normalize: just return the cleaned CSV text for Claude to interpret.
  // Claude is better at understanding varied bank statement formats than
  // a rigid parser would be.
  const cleaned = lines
    .filter((line) => line.trim().length > 0)
    .slice(0, 100) // Cap at 100 rows to stay within token limits
    .join('\n');

  return cleaned;
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
