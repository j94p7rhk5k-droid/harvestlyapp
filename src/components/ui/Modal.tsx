'use client';

import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional footer slot (e.g. action buttons) */
  footer?: ReactNode;
  /** Max width class override */
  maxWidth?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ─── Component ──────────────────────────────────────────────────────────────

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  // Ref-based handler so the effect below depends ONLY on `open` —
  // parent re-renders must not tear down the listener + steal focus.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;

      const focusables = cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !cardRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus the first focusable element inside the card
    const raf = requestAnimationFrame(() => {
      const first = cardRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    });

    const previouslyFocused = restoreFocusRef.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Only restore focus when the modal actually closes. The effect re-runs
      // only when `open` flips, so this cleanup truly means "closing".
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={cardRef}
        className={cn(
          'relative w-full rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl animate-modal-in',
          maxWidth
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render as portal
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
