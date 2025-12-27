import React from 'react';
import type { StockStatus } from '../types';

interface StockBadgeProps {
  status?: StockStatus;
  quantity?: number;
  showQuantity?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const StockBadge: React.FC<StockBadgeProps> = ({
  status = 'in-stock',
  quantity,
  showQuantity = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'out-of-stock':
        return {
          text: 'Out of Stock',
          bgClass: 'bg-red-100 dark:bg-red-900/30',
          textClass: 'text-red-700 dark:text-red-400',
          dotClass: 'bg-red-500',
        };
      case 'low-stock':
        return {
          text: showQuantity && quantity ? `Only ${quantity} left` : 'Low Stock',
          bgClass: 'bg-amber-100 dark:bg-amber-900/30',
          textClass: 'text-amber-700 dark:text-amber-400',
          dotClass: 'bg-amber-500 animate-pulse',
        };
      case 'in-stock':
      default:
        return {
          text: 'In Stock',
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          textClass: 'text-green-700 dark:text-green-400',
          dotClass: 'bg-green-500',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]} ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.text}
    </span>
  );
};

// Stock indicator for product cards (more compact)
export const StockIndicator: React.FC<{
  status?: StockStatus;
  className?: string;
}> = ({ status = 'in-stock', className = '' }) => {
  if (status === 'in-stock') return null; // Don't show for in-stock items to reduce clutter

  const config =
    status === 'out-of-stock'
      ? { text: 'Sold Out', className: 'bg-red-600 text-white' }
      : { text: 'Low Stock', className: 'bg-amber-500 text-white' };

  return (
    <span
      className={`absolute top-2 left-2 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-sm z-10 ${config.className} ${className}`}
    >
      {config.text}
    </span>
  );
};

// "Notify Me" button for out of stock products
export const NotifyMeButton: React.FC<{
  productId: number;
  productName: string;
  onNotify?: (email: string) => void;
  className?: string;
}> = ({ productId, productName, onNotify, className = '' }) => {
  const [email, setEmail] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onNotify) {
      onNotify(email);
    }
    // Store in localStorage as backup
    const notifications = JSON.parse(localStorage.getItem('petbhai_stock_notifications') || '[]');
    notifications.push({ productId, productName, email, date: new Date().toISOString() });
    localStorage.setItem('petbhai_stock_notifications', JSON.stringify(notifications));
    setIsSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setEmail('');
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center gap-2 text-green-600 dark:text-green-400 ${className}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">We'll notify you!</span>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Notify me when available
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-grow px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-800"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Notify
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </form>
  );
};

export default StockBadge;
