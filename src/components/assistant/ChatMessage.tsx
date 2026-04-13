'use client';

import { motion } from 'framer-motion';
import { Check, AlertCircle, Upload, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, ChatAction } from '@/types/chat';

function ActionBadge({ action }: { action: ChatAction }) {
  const labels: Record<string, string> = {
    add_category: 'Created category',
    add_transaction: 'Added transaction',
    update_category_budget: 'Updated budget',
    import_transactions: 'Imported transactions',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg mt-1.5',
        action.status === 'executed'
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-red-500/10 text-red-400',
      )}
    >
      {action.status === 'executed' ? (
        <Check className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      <span>
        {labels[action.type] ?? action.type}
        {action.type === 'add_category' && action.params.name && `: ${action.params.name}`}
        {action.type === 'add_transaction' && action.params.amount && `: $${action.params.amount}`}
        {action.type === 'import_transactions' &&
          action.params.transactions &&
          `: ${action.params.transactions.length} items`}
        {action.status === 'failed' && action.error && ` — ${action.error}`}
      </span>
    </div>
  );
}

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-500 text-white rounded-br-md'
            : 'bg-navy-800 text-navy-100 rounded-bl-md',
        )}
      >
        {/* File attachment indicator */}
        {message.fileInfo && (
          <div className="flex items-center gap-2 text-xs opacity-75 mb-1.5 pb-1.5 border-b border-white/10">
            <Upload className="w-3 h-3" />
            <span className="truncate">{message.fileInfo.name}</span>
          </div>
        )}

        {/* Message text */}
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Action badges */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.actions.map((action) => (
              <ActionBadge key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
