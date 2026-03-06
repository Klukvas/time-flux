import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-text hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-theme',
  secondary:
    'border border-edge bg-transparent text-content hover:bg-[var(--color-surface-alt)] focus-visible:ring-2 focus-visible:ring-theme',
  danger:
    'bg-danger text-white hover:bg-danger-hover focus-visible:ring-2 focus-visible:ring-danger',
  ghost:
    'bg-transparent text-content hover:bg-[var(--color-surface-alt)] focus-visible:ring-2 focus-visible:ring-theme',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          aria-hidden="true"
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
