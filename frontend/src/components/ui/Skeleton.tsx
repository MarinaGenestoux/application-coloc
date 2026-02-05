interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantStyles = {
  text: 'h-4 rounded-md',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
  card: 'rounded-2xl',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-shimmer bg-slate-200 ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonStat({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 lg:p-8 ${className}`}>
      <div className="flex items-start justify-between">
        <Skeleton variant="rectangular" width={48} height={48} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className="mt-3 sm:mt-5 space-y-2">
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="text" width="70%" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`divide-y divide-slate-100 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
          <Skeleton variant="rectangular" width={80} height={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={80} />
        </div>
        <Skeleton variant="rectangular" width={100} height={32} />
      </div>
      <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl" />
    </div>
  );
}
