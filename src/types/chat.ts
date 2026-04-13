import type { CategoryType } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
  fileInfo?: { name: string; type: string; size: number };
}

export type ChatActionType =
  | 'add_category'
  | 'add_transaction'
  | 'delete_transaction'
  | 'update_category_budget'
  | 'import_transactions'
  | 'clear_data';

export type ChatActionStatus = 'pending' | 'executed' | 'failed';

export interface ChatAction {
  id: string;
  type: ChatActionType;
  params: Record<string, any>;
  status: ChatActionStatus;
  error?: string;
}

export interface FileAttachment {
  name: string;
  type: 'csv' | 'pdf';
  content: string; // text for CSV, base64 for PDF
}

// API request/response types
export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  budgetContext: {
    month: string;
    categories: { id: string; name: string; type: CategoryType; planned: number; actual: number }[];
    recentTransactions: { id: string; categoryName: string; type: CategoryType; amount: number; date: string; note?: string }[];
    currency: string;
  };
  files?: FileAttachment[];
}
