import React from 'react';

// Generic skeleton wrapper
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', animate = true }) => (
  <div
    className={`bg-slate-200 dark:bg-slate-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

// Product card skeleton
export const ProductCardSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden flex flex-col h-full">
    {/* Image placeholder */}
    <div className="relative aspect-[4/3] sm:aspect-square">
      <Skeleton className="w-full h-full rounded-none" />
      <Skeleton className="absolute top-2 right-2 sm:top-3 sm:right-3 w-16 h-5 rounded-full" />
    </div>
    {/* Content */}
    <div className="p-2 sm:p-5 flex flex-col flex-grow">
      <Skeleton className="h-4 sm:h-6 w-3/4 mb-2" />
      <Skeleton className="h-3 sm:h-4 w-1/4 mb-4" />
      <div className="flex justify-between items-end mt-auto">
        <Skeleton className="h-5 sm:h-7 w-20" />
        <Skeleton className="h-5 sm:h-6 w-12 rounded-md" />
      </div>
    </div>
    {/* Button area */}
    <div className="p-2 sm:p-4 bg-white/50 dark:bg-black/20 border-t border-white/20 dark:border-slate-700/30">
      <Skeleton className="h-8 sm:h-10 w-full rounded-lg" />
    </div>
  </div>
);

// Article card skeleton
export const ArticleCardSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden flex flex-col h-full">
    <Skeleton className="w-full h-48 rounded-none" />
    <div className="p-5 flex flex-col flex-grow">
      <Skeleton className="h-3 w-1/4 mb-3" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-auto pt-4 flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

// Vet card skeleton
export const VetCardSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden flex flex-col h-full">
    <div className="p-5 flex items-start gap-4">
      <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
      <div className="flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
    <div className="px-5 pb-5">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="mt-auto p-4 border-t border-slate-200/50 dark:border-slate-700/50">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
);

// Animal card skeleton (for adoption)
export const AnimalCardSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden flex flex-col h-full">
    <Skeleton className="w-full aspect-square rounded-none" />
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
);

// List item skeleton (for search results, etc.)
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
    <div className="flex-grow">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="glass-card p-6">
    <div className="flex items-center gap-6 mb-6">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="flex-grow">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

// Order item skeleton
export const OrderItemSkeleton: React.FC = () => (
  <div className="glass-card p-4">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
    <div className="flex gap-4 mb-4">
      <Skeleton className="w-16 h-16 rounded-lg" />
      <div className="flex-grow">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-28" />
    </div>
  </div>
);

// Comment skeleton
export const CommentSkeleton: React.FC = () => (
  <div className="flex gap-3 p-4">
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-grow">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Post skeleton (for community page)
export const PostSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden">
    {/* Header */}
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-grow">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    {/* Content */}
    <div className="px-4 pb-3">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    {/* Image */}
    <Skeleton className="w-full h-64" />
    {/* Actions */}
    <div className="p-4 flex gap-4">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  </div>
);

// Full page loading skeleton
export const PageLoadingSkeleton: React.FC<{ message?: string }> = ({ message }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-4xl mx-auto">
      {/* Page title */}
      <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
      <Skeleton className="h-5 w-2/3 mx-auto mb-8" />
      {/* Content sections */}
      <div className="glass-card p-6 mb-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="glass-card p-6">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
      {message && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 animate-pulse">
          {message}
        </p>
      )}
    </div>
  </div>
);

// Grid of product skeletons
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Grid of article skeletons
export const ArticleGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ArticleCardSkeleton key={i} />
    ))}
  </div>
);

// Spinner component for inline loading
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Loading overlay for async operations
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="glass-card p-8 flex flex-col items-center gap-4">
      <Spinner size="lg" className="text-orange-500" />
      <p className="text-slate-700 dark:text-slate-200 font-medium">{message}</p>
    </div>
  </div>
);

// Button loading state
export const ButtonSpinner: React.FC = () => <Spinner size="sm" className="text-current" />;

export default Skeleton;
