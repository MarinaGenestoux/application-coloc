import type { ReactNode, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const variants = {
  primary: `
    bg-primary text-white
    shadow-md shadow-primary/25
    hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30
    focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2
    active:shadow-sm
  `,
  secondary: `
    bg-white text-slate-700
    border border-slate-200 shadow-sm
    hover:bg-slate-50 hover:border-slate-300 hover:shadow-md
    focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2
  `,
  ghost: `
    bg-transparent text-slate-600
    hover:bg-slate-100 hover:text-slate-800
    focus-visible:ring-2 focus-visible:ring-slate-200
  `,
  danger: `
    bg-red-500 text-white
    shadow-md shadow-red-500/25
    hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30
    focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2
    active:shadow-sm
  `,
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-sm gap-2 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  onClick,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={isDisabled}
      type={type}
      onClick={onClick}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}
