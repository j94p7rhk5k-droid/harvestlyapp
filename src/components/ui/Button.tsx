import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ─── Variants & Sizes ──────────────────────────────────────────────────────

const VARIANT_CLASSES = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-glow hover:shadow-glow-lg btn-glow',
  secondary:
    'bg-navy-800 text-white hover:bg-navy-700 border border-navy-700',
  ghost:
    'bg-transparent text-navy-300 hover:text-white hover:bg-navy-800/50',
  danger:
    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
} as const;

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;
type ButtonSize = keyof typeof SIZE_CLASSES;

// ─── Props ──────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon to display on the left side */
  iconLeft?: ReactNode;
  /** Icon to display on the right side */
  iconRight?: ReactNode;
  children: ReactNode;
}

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin-slow', className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring',
          'active:scale-[0.98]',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          isDisabled && 'opacity-50 pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner className="w-4 h-4" />
        ) : iconLeft ? (
          <span className="flex-shrink-0">{iconLeft}</span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
