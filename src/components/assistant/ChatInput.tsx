'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = [
  'text/csv',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function isAcceptedFile(file: File): boolean {
  return (
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.xlsx')
  );
}

interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(isAcceptedFile);
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if ((!text.trim() && files.length === 0) || disabled) return;
    onSend(text.trim(), files.length > 0 ? files : undefined);
    setText('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, files, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }, [addFiles]);

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div
      className={cn(
        'border-t border-navy-800 p-3 transition-colors',
        isDragOver && 'bg-brand-500/5 border-brand-500/30',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="text-center py-3 text-sm text-brand-400 mb-2">
          Drop your files here (CSV, PDF)
        </div>
      )}

      {/* Attached files preview */}
      {files.length > 0 && (
        <div className="space-y-1 mb-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-800/50 text-xs text-navy-300">
              <FileText className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-navy-500 flex-shrink-0">
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <button
                onClick={() => removeFile(i)}
                className="p-0.5 rounded hover:bg-navy-700 text-navy-500 hover:text-navy-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-navy-500 hover:text-brand-400 hover:bg-navy-800/50 transition-colors flex-shrink-0"
          title="Attach files (CSV, PDF)"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,.xls,.xlsx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={files.length > 0 ? 'Describe what to do with these files...' : 'Tell me about your budget...'}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-navy-800/50 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white placeholder-navy-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50 transition-all"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className={cn(
            'p-2 rounded-xl transition-all flex-shrink-0',
            disabled || (!text.trim() && files.length === 0)
              ? 'text-navy-600 bg-navy-800/30'
              : 'text-white bg-brand-500 hover:bg-brand-600 shadow-sm',
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
