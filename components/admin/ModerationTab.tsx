import React from 'react';
import type { ModerationReportSummary, ModerationStatusFilter, ModerationQueueStatus, ModerationAction } from '../../types/admin';

interface ModerationTabProps {
  filteredModerationReports: ModerationReportSummary[];
  loading: boolean;
  moderationStatusFilter: ModerationStatusFilter;
  setModerationStatusFilter: (filter: ModerationStatusFilter) => void;
  savingModerationId: string;
  loadDashboardData: () => Promise<void>;
  handleModerationAction: (
    reportId: string,
    status: ModerationQueueStatus,
    action: ModerationAction,
    note?: string
  ) => Promise<void>;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  filteredModerationReports,
  loading,
  moderationStatusFilter,
  setModerationStatusFilter,
  savingModerationId,
  loadDashboardData,
  handleModerationAction,
}) => {
  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Community Moderation Queue
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={moderationStatusFilter}
              onChange={(event) =>
                setModerationStatusFilter(event.target.value as ModerationStatusFilter)
              }
              aria-label="Filter moderation reports"
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All</option>
            </select>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Reporter</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredModerationReports.map((report) => {
                const isSaving = savingModerationId === report.id;
                const targetLabel =
                  report.targetType === 'post'
                    ? `Post #${report.targetPostId}`
                    : report.targetType === 'comment'
                      ? `Comment #${report.targetCommentId} on Post #${report.targetPostId}`
                      : `Reply #${report.targetReplyId} on Comment #${report.targetCommentId}`;

                return (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 capitalize">
                      {report.targetType}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{targetLabel}</td>
                    <td
                      className="max-w-[260px] truncate px-4 py-3 text-slate-600 dark:text-slate-300"
                      title={report.reason}
                    >
                      {report.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      #{report.reporterId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'reviewed',
                              'hide',
                              'Hidden by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                        >
                          Hide
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'reviewed',
                              'restore',
                              'Restored by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'dismissed',
                              'none',
                              'Dismissed by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-slate-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filteredModerationReports.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  No moderation reports found for the selected filter.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  Loading moderation queue...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
