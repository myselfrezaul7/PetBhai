import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest, getErrorMessage } from '../../services/apiClient';
import type { Question } from '../../types';

const TOPIC_ICONS: Record<string, string> = {
  'Dog Care': '🐕',
  'Cat Care': '🐱',
  'Pet Health': '💉',
  Health: '💉',
  Nutrition: '🥩',
  Training: '🎓',
  General: '🐾',
};

export const QuestionsTab: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Question[]>('/questions');
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching admin questions:', err);
      setError(getErrorMessage(err, 'Failed to load questions from server.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleStatusChange = async (id: number, newStatus: 'pending' | 'answered' | 'rejected') => {
    setActionLoadingId(id);
    try {
      await apiRequest<{ success: boolean; question: Question }>(`/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
    } catch (err: any) {
      alert(`Error: ${getErrorMessage(err, 'Could not update question.')}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this question?')) {
      return;
    }

    setActionLoadingId(id);
    try {
      await apiRequest<{ success: boolean }>(`/questions/${id}`, {
        method: 'DELETE',
      });

      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(`Error: ${getErrorMessage(err, 'Could not delete question.')}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyQuestion = (id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchTerm.trim() ||
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.email && q.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTopic =
        topicFilter === 'all' || q.topic.toLowerCase() === topicFilter.toLowerCase();

      const currentStatus = q.status || 'pending';
      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;

      return matchesSearch && matchesTopic && matchesStatus;
    });
  }, [questions, searchTerm, topicFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = questions.length;
    const pending = questions.filter((q) => (q.status || 'pending') === 'pending').length;
    const answered = questions.filter((q) => q.status === 'answered').length;
    return { total, pending, answered };
  }, [questions]);

  return (
    <section className="mt-1 space-y-4">
      {/* Top Header Card with Stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Blog Q&A Inquiries
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Questions asked by visitors via the "Ask PetBhai" blog section. Use them to brainstorm
              and write upcoming blog articles!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total: <strong>{stats.total}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              Pending: <strong>{stats.pending}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Answered: <strong>{stats.answered}</strong>
            </span>
            <button
              type="button"
              onClick={fetchQuestions}
              disabled={loading}
              className="ml-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by question, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500 dark:text-slate-400 font-medium">Topic:</label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Topics</option>
              <option value="Dog Care">🐕 Dog Care</option>
              <option value="Cat Care">🐱 Cat Care</option>
              <option value="Health">💉 Pet Health</option>
              <option value="Nutrition">🥩 Nutrition</option>
              <option value="Training">🎓 Training</option>
              <option value="General">🐾 General</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500 dark:text-slate-400 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <span className="animate-spin inline-block mr-2">⏳</span> Loading inquiries...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <span className="text-2xl">🔍</span>
          </div>
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No questions found
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm || topicFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Submitted questions from blog visitors will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isAnswered = q.status === 'answered';
            const isRejected = q.status === 'rejected';
            const icon = TOPIC_ICONS[q.topic] || '🐾';
            const isActing = actionLoadingId === q.id;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-300/70 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                      <span>{icon}</span>
                      <span>{q.topic}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isAnswered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isRejected
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isAnswered
                            ? 'bg-emerald-500'
                            : isRejected
                              ? 'bg-slate-400'
                              : 'bg-orange-500 animate-pulse'
                        }`}
                      />
                      {isAnswered ? 'Answered' : isRejected ? 'Rejected' : 'Pending Review'}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Asker Details */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                    <span>Asked by: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{q.name}</strong>
                    {q.email && (
                      <span className="block sm:inline sm:ml-2 text-[11px] text-orange-600 dark:text-orange-400">
                        <a href={`mailto:${q.email}`} className="hover:underline">
                          ✉️ {q.email}
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-sm font-medium text-slate-800 dark:bg-slate-800/60 dark:text-slate-100 border border-slate-100 dark:border-slate-800">
                  "{q.question}"
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q.id, q.question)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copiedId === q.id ? '✅ Copied!' : '📋 Copy Question'}
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleStatusChange(q.id, isAnswered ? 'pending' : 'answered')}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isAnswered
                          ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {isActing ? '...' : isAnswered ? '↩️ Mark Pending' : '✅ Mark Answered'}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleDelete(q.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
