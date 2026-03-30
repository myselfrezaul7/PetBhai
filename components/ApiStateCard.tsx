import React from 'react';

interface ApiStateCardProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ApiStateCard: React.FC<ApiStateCardProps> = ({ title, message, actionLabel, onAction }) => {
  return (
    <div className="glass-card-ios mx-auto max-w-2xl border border-white/35 bg-white/50 p-6 text-center dark:border-white/10 dark:bg-slate-900/35 sm:p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100/80 text-red-600 dark:bg-red-500/20 dark:text-red-300">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3Z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 min-h-[44px] rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 active:scale-[0.98] touch-manipulation sm:text-base"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default React.memo(ApiStateCard);
