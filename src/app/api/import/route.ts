import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'bill' | 'savings' | 'debt';
  categoryName: string;
  note: string;
}

// ─── Pass 1: Extract transactions from PDF ───────────────────────────────────

async function extractTransactions(
  fileContent: string,
  fileType: 'pdf' | 'csv',
  fileName: string,
): Promise<ExtractedTransaction[]> {
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  if (fileType === 'pdf') {
    contentBlocks.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: fileContent,
      },
    } as any);
  }

  contentBlocks.push({
    type: 'text',
    text: fileType === 'csv'
      ? `Here is a bank/credit card statement CSV file "${fileName}":\n\n${fileContent}\n\nExtract every single transaction from this file.`
      : `Extract every single transaction from this bank/credit card statement PDF "${fileName}".`,
  });

  contentBlocks.push({
    type: 'text',
    text: `Return ONLY a JSON array with no other text. Each object must have:
- "date": ISO date string (YYYY-MM-DD)
- "description": the merchant/payee name or transaction description
- "amount": positive number (absolute value)
- "type": "income" for credits/deposits/payments received, "expense" for debits/charges/purchases

Important:
- Include EVERY transaction, do not skip any
- Convert all amounts to positive numbers
- Use the actual dates from the statement
- Return raw JSON array only, no markdown, no explanation`,
  });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16000,
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Parse JSON — handle markdown code blocks if Claude wraps it
  const jsonStr = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array from extraction');
  }

  return parsed as ExtractedTransaction[];
}

// ─── Pass 2: Categorize transactions ─────────────────────────────────────────

async function categorizeTransactions(
  transactions: ExtractedTransaction[],
  existingCategories: { name: string; type: string }[],
  currency: string,
): Promise<CategorizedTransaction[]> {
  const categoryList = existingCategories.length > 0
    ? existingCategories.map((c) => `  - ${c.name} (${c.type})`).join('\n')
    : '  (no existing categories)';

  // Process in chunks of 100 to stay within token limits
  const CHUNK_SIZE = 100;
  const allCategorized: CategorizedTransaction[] = [];

  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: `Categorize these ${chunk.length} transactions into budget categories.

Existing categories the user already has:
${categoryList}

Transactions to categorize:
${JSON.stringify(chunk)}

Return ONLY a JSON array. Each object must have:
- "date": keep the original date (YYYY-MM-DD)
- "description": keep the original description
- "amount": keep the original amount (positive number)
- "type": one of "income", "expense", "bill", "savings", "debt"
  - Use "bill" for recurring charges (utilities, subscriptions, insurance, rent, phone)
  - Use "income" for deposits, paychecks, refunds, credits
  - Use "expense" for one-time purchases, food, shopping, gas, entertainment
  - Use "debt" for loan payments, credit card payments
  - Use "savings" for transfers to savings
- "categoryName": match to an existing category name when possible. If no match, create a sensible short category name (e.g., "Groceries", "Gas", "Amazon", "Electric Bill")
- "note": brief description from the original transaction

Rules:
- Match existing categories by name when the transaction fits
- Keep category names short and consistent
- Return raw JSON array only, no markdown, no explanation`,
      }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const jsonStr = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      allCategorized.push(...parsed);
    }
  }

  return allCategorized;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fileContent, fileType, fileName, transactions, categories, currency } = body;

    if (action === 'extract') {
      // Pass 1: Extract raw transactions from the file
      const extracted = await extractTransactions(fileContent, fileType, fileName);
      return Response.json({
        success: true,
        transactions: extracted,
        count: extracted.length,
      });
    }

    if (action === 'categorize') {
      // Pass 2: Categorize extracted transactions
      const categorized = await categorizeTransactions(transactions, categories ?? [], currency ?? '$');
      return Response.json({
        success: true,
        transactions: categorized,
        count: categorized.length,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[import/route] Error:', err?.message);
    return Response.json(
      { error: err.message ?? 'Import failed', details: String(err) },
      { status: 500 },
    );
  }
}
