import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, getErrorMessage } from '../../services/apiClient';
import { useArticles } from '../../contexts/ArticleContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Question } from '../../types';

type AdminQuestion = Question & {
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  answeredBlogSlug?: string;
  answeredBlogTitle?: string;
  helpfulCount?: number;
};

interface AnswerDraft {
  answer: string;
  answeredBy: string;
  answeredBlogSlug: string;
  answeredBlogTitle: string;
}

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
  const { articles } = useArticles();
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Inline answer editor state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorDraft, setEditorDraft] = useState<AnswerDraft>({
    answer: '',
    answeredBy: '',
    answeredBlogSlug: '',
    answeredBlogTitle: '',
  });
  const [editorError, setEditorError] = useState<string | null>(null);

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => a.title.localeCompare(b.title));
  }, [articles]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AdminQuestion[]>('/questions');
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error fetching admin questions:', err);
      setError(getErrorMessage(err, 'Failed to load questions from server.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const flashNotice = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const openAnswerEditor = (q: AdminQuestion) => {
    if (editingId === q.id) {
      setEditingId(null);
      setEditorError(null);
      return;
    }

    const matchedArticle = q.answeredBlogSlug
      ? articles.find((a) => a.slug === q.answeredBlogSlug || String(a.id) === q.answeredBlogSlug)
      : undefined;

    setEditingId(q.id);
    setEditorError(null);
    setEditorDraft({
      answer: q.answer || '',
      answeredBy: q.answeredBy || currentUser?.name || 'PetBhai Pet Care Team',
      answeredBlogSlug: q.answeredBlogSlug || '',
      answeredBlogTitle: q.answeredBlogTitle || matchedArticle?.title || '',
    });
  };

  const handleSelectArticleSlug = (slugValue: string) => {
    if (!slugValue) {
      setEditorDraft((prev) => ({
        ...prev,
        answeredBlogSlug: '',
        answeredBlogTitle: '',
      }));
      return;
    }

    const found = articles.find((a) => (a.slug || String(a.id)) === slugValue);
    setEditorDraft((prev) => ({
      ...prev,
      answeredBlogSlug: slugValue,
      answeredBlogTitle: found ? found.title : prev.answeredBlogTitle,
    }));
  };

  const handleSaveAnswer = async (q: AdminQuestion, markAnswered: boolean) => {
    const trimmedAnswer = editorDraft.answer.trim();
    const trimmedSlug = editorDraft.answeredBlogSlug.trim();
    const trimmedTitle = editorDraft.answeredBlogTitle.trim();
    const trimmedBy = editorDraft.answeredBy.trim() || 'PetBhai Pet Care Team';

    if (markAnswered && !trimmedAnswer && !trimmedSlug) {
      setEditorError(
        'Please write an answer or link a related blog guide before marking answered.'
      );
      return;
    }

    setActionLoadingId(q.id);
    setEditorError(null);

    try {
      const nextStatus: 'pending' | 'answered' | 'rejected' = markAnswered
        ? 'answered'
        : q.status || 'pending';

      const payload: {
        status: 'pending' | 'answered' | 'rejected';
        answer: string;
        answeredBy: string;
        answeredBlogSlug: string;
        answeredBlogTitle?: string;
      } = {
        status: nextStatus,
        answer: trimmedAnswer,
        answeredBy: trimmedBy,
        answeredBlogSlug: trimmedSlug,
      };

      if (trimmedTitle) {
        payload.answeredBlogTitle = trimmedTitle;
      } else if (!trimmedSlug) {
        payload.answeredBlogTitle = '';
      }

      const response = await apiRequest<{ success: boolean; question?: AdminQuestion }>(
        `/questions/${q.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const updatedQuestion: AdminQuestion = response?.question
        ? response.question
        : {
            ...q,
            ...payload,
            status: nextStatus,
            answeredAt: markAnswered ? new Date().toISOString() : q.answeredAt,
          };

      setQuestions((prev) => prev.map((item) => (item.id === q.id ? updatedQuestion : item)));
      setEditingId(null);
      flashNotice(
        markAnswered
          ? 'Answer saved and question marked as Answered!'
          : 'Answer draft saved successfully.'
      );
    } catch (err: unknown) {
      setEditorError(getErrorMessage(err, 'Could not save answer. Please try again.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'pending' | 'answered' | 'rejected') => {
    setActionLoadingId(id);
    setError(null);
    try {
      const response = await apiRequest<{ success: boolean; question?: AdminQuestion }>(
        `/questions/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, ...(response?.question || {}), status: newStatus } : q
        )
      );
      flashNotice(`Question status updated to ${newStatus}.`);
    } catch (err: unknown) {
      setError(`Error: ${getErrorMessage(err, 'Could not update question.')}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this question?')) {
      return;
    }

    setActionLoadingId(id);
    setError(null);
    try {
      await apiRequest<{ success: boolean }>(`/questions/${id}`, {
        method: 'DELETE',
      });

      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      flashNotice('Question permanently deleted.');
    } catch (err: unknown) {
      setError(`Error: ${getErrorMessage(err, 'Could not delete question.')}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyQuestion = (id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredQuestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return questions.filter((q) => {
      const matchesSearch =
        !query ||
        q.question.toLowerCase().includes(query) ||
        q.name.toLowerCase().includes(query) ||
        (q.email && q.email.toLowerCase().includes(query)) ||
        (q.answer && q.answer.toLowerCase().includes(query)) ||
        (q.answeredBlogSlug && q.answeredBlogSlug.toLowerCase().includes(query));

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
              Answer visitor questions from the "Ask PetBhai" blog Q&A hub and link helpful blog
              guides directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => void fetchQuestions()}
              disabled={loading}
              className="ml-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50"
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
              placeholder="Search by question, answer, name, email, or blog slug..."
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

      {/* Feedback Banners */}
      {statusNotice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          ✅ {statusNotice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
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
            const isEditing = editingId === q.id;
            const icon = TOPIC_ICONS[q.topic] || '🐾';
            const isActing = actionLoadingId === q.id;
            const hasSavedAnswer = Boolean(q.answer && q.answer.trim().length > 0);

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

                    {(q.helpfulCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        👍 {q.helpfulCount} helpful
                      </span>
                    )}

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

                {/* Saved Answer Preview (when not editing) */}
                {!isEditing && (hasSavedAnswer || q.answeredBlogSlug) && (
                  <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        🐾 Official Answer ({q.answeredBy || 'PetBhai Pet Care Team'})
                      </span>
                      {q.answeredAt && (
                        <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                          {new Date(q.answeredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    {hasSavedAnswer && (
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {q.answer}
                      </p>
                    )}
                    {q.answeredBlogSlug && (
                      <div className="pt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Linked Guide:</span>
                        <Link
                          to={`/blog/${q.answeredBlogSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                        >
                          📖 {q.answeredBlogTitle || `/blog/${q.answeredBlogSlug}`} ↗
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable Inline Answer Editor */}
                {isEditing && (
                  <div className="mt-3 rounded-xl border border-orange-300/80 bg-orange-50/50 p-4 dark:border-orange-500/30 dark:bg-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                        ✏️ PetBhai Answer Editor
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditorError(null);
                        }}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Close ✕
                      </button>
                    </div>

                    {editorError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        {editorError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor={`answer-text-${q.id}`}
                        className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                      >
                        Official PetBhai Team Answer
                      </label>
                      <textarea
                        id={`answer-text-${q.id}`}
                        rows={4}
                        maxLength={2500}
                        value={editorDraft.answer}
                        onChange={(e) =>
                          setEditorDraft((prev) => ({ ...prev, answer: e.target.value }))
                        }
                        placeholder="Write a clear, helpful pet care answer that will appear publicly in the Questions by Visitors hub..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`answered-by-${q.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                        >
                          Answered By
                        </label>
                        <input
                          id={`answered-by-${q.id}`}
                          type="text"
                          maxLength={80}
                          value={editorDraft.answeredBy}
                          onChange={(e) =>
                            setEditorDraft((prev) => ({ ...prev, answeredBy: e.target.value }))
                          }
                          placeholder="PetBhai Pet Care Team"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`article-picker-${q.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                        >
                          Pick Related Blog Guide (Optional)
                        </label>
                        <select
                          id={`article-picker-${q.id}`}
                          value={
                            sortedArticles.some(
                              (a) => (a.slug || String(a.id)) === editorDraft.answeredBlogSlug
                            )
                              ? editorDraft.answeredBlogSlug
                              : ''
                          }
                          onChange={(e) => handleSelectArticleSlug(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="">— Select an existing article —</option>
                          {sortedArticles.map((article) => {
                            const slugKey = article.slug || String(article.id);
                            return (
                              <option key={article.id} value={slugKey}>
                                {article.title}
                                {article.category ? ` (${article.category})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`blog-slug-${q.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                        >
                          Blog Guide Slug (Optional)
                        </label>
                        <input
                          id={`blog-slug-${q.id}`}
                          type="text"
                          maxLength={160}
                          value={editorDraft.answeredBlogSlug}
                          onChange={(e) =>
                            setEditorDraft((prev) => ({
                              ...prev,
                              answeredBlogSlug: e.target.value,
                            }))
                          }
                          placeholder="e.g. summer-cat-hydration-guide"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`blog-title-${q.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                        >
                          Linked Guide Title (Optional)
                        </label>
                        <input
                          id={`blog-title-${q.id}`}
                          type="text"
                          maxLength={160}
                          value={editorDraft.answeredBlogTitle}
                          onChange={(e) =>
                            setEditorDraft((prev) => ({
                              ...prev,
                              answeredBlogTitle: e.target.value,
                            }))
                          }
                          placeholder="Auto-filled when picking an article"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => {
                          setEditingId(null);
                          setEditorError(null);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => void handleSaveAnswer(q, false)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 disabled:opacity-50"
                      >
                        {isActing ? 'Saving...' : 'Save Draft'}
                      </button>

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => void handleSaveAnswer(q, true)}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {isActing ? 'Saving...' : '✅ Save & Mark Answered'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => openAnswerEditor(q)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isEditing
                          ? 'border border-orange-400 bg-orange-100 text-orange-900 dark:border-orange-500/60 dark:bg-orange-950/50 dark:text-orange-200'
                          : 'border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300'
                      }`}
                    >
                      {isEditing
                        ? 'Close Editor'
                        : hasSavedAnswer
                          ? '✏️ Edit Answer'
                          : '✏️ Write Answer'}
                    </button>

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
                      onClick={() =>
                        void handleStatusChange(q.id, isAnswered ? 'pending' : 'answered')
                      }
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
                    onClick={() => void handleDelete(q.id)}
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
