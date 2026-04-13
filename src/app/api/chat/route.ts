import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { ChatRequest } from '@/types/chat';

// Increase timeout for PDF processing with agentic tool use loop
export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tool definitions ────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: 'add_category',
    description:
      'Create a new budget category. Use when the user mentions a new income source, expense, bill, or savings category that does not already exist in their budget.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Category name, e.g. "Groceries", "Salary"' },
        type: {
          type: 'string',
          enum: ['income', 'expense', 'bill', 'savings', 'debt'],
          description: 'Category type',
        },
        planned: {
          type: 'number',
          description: 'Planned monthly budget amount. Use 0 if the user did not specify.',
        },
      },
      required: ['name', 'type', 'planned'],
    },
  },
  {
    name: 'add_transaction',
    description:
      'Record a single transaction. Use when the user reports spending, receiving income, or paying a bill.',
    input_schema: {
      type: 'object' as const,
      properties: {
        categoryName: { type: 'string', description: 'The category name this belongs to.' },
        categoryId: {
          type: 'string',
          description:
            'The ID of an existing category. Use empty string if the category was just created or needs to be created first.',
        },
        type: {
          type: 'string',
          enum: ['income', 'expense', 'bill', 'savings', 'debt'],
        },
        amount: { type: 'number', description: 'Transaction amount (positive number)' },
        date: { type: 'string', description: 'ISO date string (YYYY-MM-DD)' },
        note: { type: 'string', description: 'Optional note' },
        isRecurring: { type: 'boolean', description: 'Whether this recurs monthly' },
      },
      required: ['categoryName', 'type', 'amount', 'date', 'isRecurring'],
    },
  },
  {
    name: 'delete_transaction',
    description:
      'Delete a transaction by its ID. Use when the user says they made a mistake, wants to remove a transaction, or asks to undo a recently added transaction. Match the transaction by amount, date, category name, or note from the recent transactions list.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transactionId: { type: 'string', description: 'The transaction ID to delete' },
        description: { type: 'string', description: 'Brief description of what is being deleted (for confirmation)' },
      },
      required: ['transactionId', 'description'],
    },
  },
  {
    name: 'clear_data',
    description:
      'Clear budget data. Use when the user asks to clear, reset, or start fresh. Can clear a specific month or all data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        scope: {
          type: 'string',
          enum: ['month', 'all'],
          description: '"month" to clear a specific month, "all" to clear everything',
        },
        month: {
          type: 'string',
          description: 'The month to clear in YYYY-MM format. Required when scope is "month".',
        },
      },
      required: ['scope'],
    },
  },
  {
    name: 'update_category_budget',
    description: 'Update the planned budget amount for an existing category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        categoryId: { type: 'string', description: 'The category ID to update' },
        categoryName: { type: 'string', description: 'The category name (for confirmation)' },
        planned: { type: 'number', description: 'New planned monthly amount' },
      },
      required: ['categoryId', 'categoryName', 'planned'],
    },
  },
  {
    name: 'import_transactions',
    description:
      'Import multiple transactions at once from a parsed bank statement or CSV. Use after analyzing file content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryName: { type: 'string' },
              categoryId: { type: 'string' },
              type: { type: 'string', enum: ['income', 'expense', 'bill', 'savings', 'debt'] },
              amount: { type: 'number' },
              date: { type: 'string' },
              note: { type: 'string' },
              isRecurring: { type: 'boolean' },
            },
            required: ['categoryName', 'type', 'amount', 'date', 'isRecurring'],
          },
        },
      },
      required: ['transactions'],
    },
  },
];

// ─── Build system prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ChatRequest['budgetContext']): string {
  const categoryList = ctx.categories.length > 0
    ? ctx.categories
        .map((c) => `  - [${c.id}] ${c.name} (${c.type}) — planned: ${ctx.currency}${c.planned}, actual: ${ctx.currency}${c.actual}`)
        .join('\n')
    : '  (no categories yet)';

  const txList = ctx.recentTransactions.length > 0
    ? ctx.recentTransactions
        .slice(0, 20)
        .map((t) => `  - [${t.id}] ${t.date}: ${t.categoryName} (${t.type}) ${ctx.currency}${t.amount}${t.note ? ` — ${t.note}` : ''}`)
        .join('\n')
    : '  (no transactions yet)';

  return `You are Harvestly, a friendly and helpful budgeting assistant. You help users manage their personal finances through natural conversation.

## What you can do
- Record income and expenses from natural language ("I spent $45 on groceries")
- Create new budget categories when needed
- Set and update monthly budget amounts
- Import transactions from bank statements (CSV files)
- Analyze spending patterns and suggest budgets
- Answer questions about the user's financial data

## Current budget context
Month: ${ctx.month}
Currency: ${ctx.currency}

### Existing categories:
${categoryList}

### Recent transactions:
${txList}

## Important rules
1. When the user mentions spending or income, use the add_transaction tool.
2. IMPORTANT: Always use an EXISTING category from the list above. Do NOT create new categories unless the user explicitly asks you to. If the transaction doesn't clearly fit an existing category, ASK the user which category it should go under. For example: "I see this is a car payment of $196.94. Which category should I put this under? Your existing options are: Car Payment (debt), Insurance (bill), or I can create a new one if you'd like."
3. For categoryId in add_transaction, use the ID from existing categories above.
4. Today's date is ${new Date().toISOString().split('T')[0]}. Use it ONLY when the user doesn't specify a date.
5. CRITICAL: When importing from bank statements or CSV files, ALWAYS use the actual transaction dates from the document. Do NOT default to today's date or the current month. A March statement must use March dates. The app will automatically route transactions to the correct monthly budget based on their dates.
6. Amounts should always be positive numbers.
7. CRITICAL: When importing many transactions (more than 30), you MUST split them into multiple import_transactions calls of 30-40 transactions each. Call import_transactions multiple times until ALL transactions are imported. Do NOT stop after the first batch — keep going until every transaction from the statement is imported.
8. Be conversational, warm, and concise. Confirm what you did after each action.
7. When analyzing file data, show the user a summary of what you found BEFORE importing. Ask for confirmation on bulk imports.
8. If you notice categories where actual spending significantly exceeds the planned budget (or planned is 0 but actual is high), proactively suggest setting or adjusting the budget.
9. Keep responses short — 1-3 sentences for simple actions, more for analysis.
10. Use the user's currency symbol (${ctx.currency}) when mentioning amounts.`;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, budgetContext, files } = body;

    // Build messages for Claude
    const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Attach files to the last user message as content blocks
    if (files && files.length > 0 && claudeMessages.length > 0) {
      const lastIdx = claudeMessages.length - 1;
      const last = claudeMessages[lastIdx];
      if (last.role === 'user') {
        const contentBlocks: Anthropic.ContentBlockParam[] = [];

        // Add the text first
        if (typeof last.content === 'string' && last.content.trim()) {
          contentBlocks.push({ type: 'text', text: last.content });
        }

        // Add each file
        for (const file of files) {
          if (file.type === 'pdf') {
            contentBlocks.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: file.content,
              },
            } as any);
          } else if (file.type === 'image' || file.mediaType?.startsWith('image/')) {
            contentBlocks.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: (file as any).mediaType ?? 'image/png',
                data: file.content,
              },
            } as any);
          } else {
            // CSV — include as text
            contentBlocks.push({
              type: 'text',
              text: `\n--- File: ${file.name} ---\n${file.content}`,
            });
          }
        }

        claudeMessages[lastIdx] = { role: 'user', content: contentBlocks };
      }
    }

    const systemPrompt = buildSystemPrompt(budgetContext);

    // Collect actions from tool use
    const actions: { id: string; type: string; params: Record<string, any> }[] = [];
    let fullResponse = '';

    // Agentic loop — handle multi-turn tool use
    let currentMessages = [...claudeMessages];
    let iterations = 0;
    const MAX_ITERATIONS = 20;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 15000,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      });

      // Process response content
      for (const block of response.content) {
        if (block.type === 'text') {
          fullResponse += block.text;
        } else if (block.type === 'tool_use') {
          actions.push({
            id: block.id,
            type: block.name,
            params: block.input as Record<string, any>,
          });
        }
      }

      // If no tool use, we're done
      if (response.stop_reason !== 'tool_use') {
        break;
      }

      // Feed tool results back to Claude (synthetic success)
      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          .map((toolUse) => ({
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify({ success: true, message: `${toolUse.name} completed successfully.` }),
          })),
      };

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        toolResults,
      ];
    }

    // Return combined response
    return Response.json({
      content: fullResponse,
      actions,
    });
  } catch (err: any) {
    console.error('[chat/route] Error:', err?.message, err?.status, err?.error);
    return Response.json(
      {
        error: err.message ?? 'Internal server error',
        details: err?.error?.message ?? err?.status ?? 'unknown',
      },
      { status: 500 },
    );
  }
}
