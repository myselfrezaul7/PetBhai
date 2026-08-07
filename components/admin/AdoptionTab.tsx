import React, { useState } from 'react';
import type { AdoptionApplicationFormData } from '../../lib/validations';

interface AdoptionApplication extends AdoptionApplicationFormData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  petName?: string;
  petType?: string;
}

export const AdoptionTab: React.FC = () => {
  // In a real implementation, we would fetch this from /api/admin/adoptions
  // For now, we use a placeholder or empty state, or mock data.
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900/50">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Adoption Applications
        </h3>
        <button
          onClick={() => {
            // Mock refresh
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="p-8 text-center bg-white dark:bg-slate-900">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <span className="text-3xl">🐾</span>
        </div>
        <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Applications Yet</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          When users submit adoption applications, they will appear here. You can review applicant details, housing conditions, and approve or reject their requests.
        </p>
      </div>
    </section>
  );
};
