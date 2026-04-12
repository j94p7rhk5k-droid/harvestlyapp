import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ─── Props ──────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Prefix displayed inside the input, e.g. "$" for currency */
  prefix?: string;
  /** Optional icon on the right side */
  iconRight?: ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, iconRight, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-navy-300 mb-1.5"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'flex items-center rounded-xl border transition-all duration-200',
            'bg-navy-800/60 border-navy-700',
            'focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20',
            error && 'border-red-500/50 focus-within:border-red-500/50 focus-within:ring-red-500/20'
          )}
        >
          {prefix && (
            <span className="pl-3.5 text-sm font-medium text-navy-400 select-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-navy-500',
              'outline-none w-full',
              prefix && 'pl-1.5',
              className
            )}
            {...props}
          />

          {iconRight && (
            <span className="pr-3.5 text-navy-400">{iconRight}</span>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
