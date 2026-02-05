import { forwardRef } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      leftIcon,
      className = '',
      id,
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`
              w-full h-12 rounded-xl border bg-white appearance-none
              text-sm text-slate-800
              shadow-sm transition-all duration-200 outline-none cursor-pointer
              hover:shadow-md hover:border-slate-300
              ${leftIcon ? 'pl-10 sm:pl-11' : 'pl-3.5 sm:pl-4'}
              pr-10
              ${
                error
                  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 focus:shadow-md'
                  : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md'
              }
              ${!value && placeholder ? 'text-slate-400' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
