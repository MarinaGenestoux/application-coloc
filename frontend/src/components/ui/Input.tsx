import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-12 rounded-xl border bg-white
              text-sm text-slate-800 placeholder:text-slate-400
              shadow-sm transition-all duration-200 outline-none
              hover:shadow-md hover:border-slate-300
              ${leftIcon ? 'pl-11 sm:pl-12' : 'pl-3.5 sm:pl-4'}
              ${rightIcon ? 'pr-11 sm:pr-12' : 'pr-3.5 sm:pr-4'}
              ${
                error
                  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 focus:shadow-md'
                  : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md'
              }
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
