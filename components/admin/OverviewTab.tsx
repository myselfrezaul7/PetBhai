import React from 'react';
import type { InventoryRow } from '../../types/admin';
import type { User } from '../../types';

interface OverviewTabProps {
  metrics: Array<{ label: string; value: string | number; tone: string }>;
  topRiskItems: InventoryRow[];
  currentUser: User | null;
  lastSyncAt: string;
  secureLogout: () => void;
  getStatusMeta: (
    stockStatus: any,
    stockLevel: number,
    reorderPoint: number
  ) => { label: string; badgeClass: string };
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  topRiskItems,
  currentUser,
  lastSyncAt,
  secureLogout,
  getStatusMeta,
}) => {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-2xl p-5 shadow-sm ${metric.tone}`}>
            <p className="text-sm opacity-90">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Inventory Risk Radar
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Highest risk products based on stock level versus reorder point.
          </p>
          <div className="mt-4 space-y-3">
            {topRiskItems.length === 0 && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                No inventory data available.
              </div>
            )}
            {topRiskItems.map((item) => {
              const statusMeta = getStatusMeta(
                item.stockStatus,
                item.stockLevel,
                item.reorderPoint
              );
              const progress = Math.max(5, Math.min(100, 100 - (item.riskScore || 0)));
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {item.productName}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                    Stock: {item.stockLevel} • Reorder: {item.reorderPoint} • SKU: {item.sku}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Security Center
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Admin Session
              </p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                {currentUser?.email || 'Unknown'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Last Sync
              </p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <button
              type="button"
              onClick={secureLogout}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
            >
              Secure Sign Out
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
