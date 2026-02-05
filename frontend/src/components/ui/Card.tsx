import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Elevation = 'flat' | 'raised' | 'elevated';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: Elevation;
  hover?: boolean;
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  sm: 'p-3 sm:p-4 lg:p-5',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-5 sm:p-6 lg:p-8',
};

const elevationStyles: Record<Elevation, string> = {
  flat: 'shadow-none border border-slate-200',
  raised: 'shadow-sm border border-slate-100',
  elevated: 'shadow-md border border-slate-100/50',
};

const hoverElevationStyles: Record<Elevation, string> = {
  flat: 'hover:border-slate-300 hover:bg-slate-50/50',
  raised: 'hover:shadow-md hover:border-slate-200',
  elevated: 'hover:shadow-lg',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  elevation = 'raised',
  hover = false,
  onClick,
}: CardProps) {
  const isInteractive = onClick || hover;
  const Component = isInteractive ? motion.div : 'div';

  const baseStyles = `bg-white rounded-2xl transition-all duration-200 ${paddingMap[padding]} ${elevationStyles[elevation]}`;
  const interactiveStyles = isInteractive ? hoverElevationStyles[elevation] : '';
  const cursorStyles = onClick ? 'cursor-pointer' : '';

  const motionProps = isInteractive
    ? {
        whileHover: { y: -2 },
        whileTap: onClick ? { scale: 0.995 } : undefined,
        transition: { duration: 0.15 },
      }
    : {};

  return (
    <Component
      className={`${baseStyles} ${interactiveStyles} ${cursorStyles} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}

const iconBgStyles = {
  primary: 'bg-primary/10 text-primary shadow-primary-sm',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-500',
  accent: 'bg-accent/20 text-accent-dark',
};

const changeBadgeStyles = {
  positive: 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100',
  negative: 'text-red-600 bg-red-50 ring-1 ring-red-100',
};

export function StatCard({ label, value, change, icon, color = 'primary' }: StatCardProps) {
  return (
    <Card padding="lg" elevation="raised" hover>
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${iconBgStyles[color]}`}>
            {icon}
          </div>
        )}
        {change && (
          <span
            className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
              change.isPositive ? changeBadgeStyles.positive : changeBadgeStyles.negative
            }`}
          >
            {change.isPositive ? '+' : ''}
            {change.value}%
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-5">
        <p className="text-2xl lg:text-3xl font-semibold text-slate-800 tracking-tight">{value}</p>
        <p className="text-sm text-slate-400 mt-1.5">{label}</p>
      </div>
    </Card>
  );
}
