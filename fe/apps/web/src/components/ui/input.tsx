import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, className = '', ...props }, ref) => (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-content"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-content placeholder:text-content-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-theme ${error ? 'border-danger' : 'border-edge hover:border-edge-hover'} ${className}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  ),
);

Input.displayName = 'Input';
