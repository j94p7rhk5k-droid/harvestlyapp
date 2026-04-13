'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if ((!text.trim() && !file) || disabled) return;
    onSend(text.trim(), file ?? undefined);
    setText('');
    setFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, file, disabled, onSend]);

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv') || droppedFile.type === 'application/pdf')) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
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
      {/* Drop zone overlay text */}
      {isDragOver && (
        <div className="text-center py-3 text-sm text-brand-400 mb-2">
          Drop your CSV or PDF file here
        </div>
      )}

      {/* Attached file preview */}
      {file && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-navy-800/50 text-xs text-navy-300">
          <FileText className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span className="truncate flex-1">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="p-0.5 rounded hover:bg-navy-700 text-navy-500 hover:text-navy-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-navy-500 hover:text-brand-400 hover:bg-navy-800/50 transition-colors flex-shrink-0"
          title="Attach CSV or PDF"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={file ? 'Describe what to do with this file...' : 'Tell me about your budget...'}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-navy-800/50 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white placeholder-navy-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50 transition-all"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && !file)}
          className={cn(
            'p-2 rounded-xl transition-all flex-shrink-0',
            disabled || (!text.trim() && !file)
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
