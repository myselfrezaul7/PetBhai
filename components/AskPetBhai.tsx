import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, getErrorMessage } from '../services/apiClient';
import { safeStorage } from '../lib/storage';
import type { Question } from '../types';

type VisitorQuestion = Question & {
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  answeredBlogSlug?: string;
  answeredBlogTitle?: string;
  helpfulCount?: number;
};

interface QuestionFormState {
  name: string;
  email: string;
  topic: string;
  question: string;
}

interface SubmitQuestionResponse {
  success: boolean;
  message?: string;
  question?: VisitorQuestion;
}

interface HelpfulQuestionResponse {
  success: boolean;
  helpfulCount?: number;
  question?: VisitorQuestion;
}

const LOCAL_QUESTIONS_KEY = 'petbhai_visitor_questions';
const HELPFUL_VOTES_KEY = 'petbhai_helpful_questions';
const HELPFUL_SYNCED_KEY = 'petbhai_helpful_questions_synced';
const MAX_LOCAL_QUESTIONS = 30;
const INITIAL_VISIBLE_QUESTIONS = 5;

const FORM_TOPICS = [
  { id: 'Dog Care', labelEn: 'Dog Care', labelBn: 'কুকুরের যত্ন', icon: '🐕' },
  { id: 'Cat Care', labelEn: 'Cat Care', labelBn: 'বিড়ালের যত্ন', icon: '🐱' },
  { id: 'Health', labelEn: 'Health', labelBn: 'স্বাস্থ্য ও চিকিৎসা', icon: '💉' },
  { id: 'Nutrition', labelEn: 'Nutrition', labelBn: 'খাবার ও পুষ্টি', icon: '🥩' },
  { id: 'Training', labelEn: 'Training', labelBn: 'প্রশিক্ষণ ও আচরণ', icon: '🎓' },
  { id: 'General', labelEn: 'General / Other', labelBn: 'অন্যান্য প্রশ্ন', icon: '🐾' },
];

const FILTER_TOPICS = [
  { id: 'All', labelEn: 'All', labelBn: 'সবগুলো', icon: '✨' },
  { id: 'Dog Care', labelEn: 'Dog Care', labelBn: 'কুকুরের যত্ন', icon: '🐕' },
  { id: 'Cat Care', labelEn: 'Cat Care', labelBn: 'বিড়ালের যত্ন', icon: '🐱' },
  { id: 'Health', labelEn: 'Health', labelBn: 'স্বাস্থ্য', icon: '💉' },
  { id: 'Nutrition', labelEn: 'Nutrition', labelBn: 'পুষ্টি', icon: '🥩' },
  { id: 'Training', labelEn: 'Training', labelBn: 'প্রশিক্ষণ', icon: '🎓' },
];

const getTopicMeta = (topic: string) => {
  const normalized = (topic || '').trim().toLowerCase();
  if (normalized === 'pet health') {
    return FORM_TOPICS.find((t) => t.id === 'Health') || FORM_TOPICS[5];
  }
  return (
    FORM_TOPICS.find((t) => t.id.toLowerCase() === normalized) || {
      id: topic || 'General',
      labelEn: topic || 'General',
      labelBn: topic || 'সাধারণ',
      icon: '🐾',
    }
  );
};

const matchesTopicFilter = (questionTopic: string, activeTopic: string): boolean => {
  if (activeTopic === 'All') return true;
  const qNorm = (questionTopic || '').trim().toLowerCase();
  const fNorm = activeTopic.trim().toLowerCase();
  if (fNorm === 'health' && (qNorm === 'health' || qNorm === 'pet health')) {
    return true;
  }
  return qNorm === fNorm;
};

const readStoredQuestions = (): VisitorQuestion[] => {
  try {
    const raw = safeStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is VisitorQuestion =>
        Boolean(item) &&
        typeof item.id === 'number' &&
        typeof item.question === 'string' &&
        item.status !== 'rejected'
    );
  } catch {
    return [];
  }
};

const saveStoredQuestions = (questions: VisitorQuestion[]): void => {
  try {
    const sanitized = questions
      .slice(0, MAX_LOCAL_QUESTIONS)
      .map(({ email: _email, ...rest }) => rest);
    safeStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage write errors
  }
};

const readNumberSet = (key: string): Set<number> => {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)));
  } catch {
    return new Set();
  }
};

const saveNumberSet = (key: string, values: Set<number>): void => {
  try {
    safeStorage.setItem(key, JSON.stringify(Array.from(values)));
  } catch {
    // Ignore storage write errors
  }
};

const mergeQuestionLists = (
  serverList: VisitorQuestion[],
  localList: VisitorQuestion[]
): VisitorQuestion[] => {
  const byId = new Map<number, VisitorQuestion>();

  for (const localQ of localList) {
    if (localQ.status === 'rejected') continue;
    byId.set(localQ.id, localQ);
  }

  for (const serverQ of serverList) {
    if (serverQ.status === 'rejected') continue;
    const existing = byId.get(serverQ.id);
    if (existing) {
      byId.set(serverQ.id, {
        ...serverQ,
        helpfulCount: Math.max(existing.helpfulCount || 0, serverQ.helpfulCount || 0),
      });
    } else {
      byId.set(serverQ.id, serverQ);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime() || 0;
    const timeB = new Date(b.createdAt || 0).getTime() || 0;
    return timeB - timeA;
  });
};

const formatDateLabel = (dateStr: string | undefined, isBn: boolean): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const AskPetBhai: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const isBn = language === 'bn';

  const [form, setForm] = useState<QuestionFormState>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    topic: 'Dog Care',
    question: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<VisitorQuestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [questions, setQuestions] = useState<VisitorQuestion[]>(() => readStoredQuestions());
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('All');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [helpfulVotedIds, setHelpfulVotedIds] = useState<Set<number>>(() =>
    readNumberSet(HELPFUL_VOTES_KEY)
  );
  const [helpfulSyncedIds, setHelpfulSyncedIds] = useState<Set<number>>(() =>
    readNumberSet(HELPFUL_SYNCED_KEY)
  );
  const [helpfulPendingId, setHelpfulPendingId] = useState<number | null>(null);

  // Pre-fill signed-in user's name and email when available
  useEffect(() => {
    if (!currentUser) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : currentUser.name || '',
      email: prev.email.trim() ? prev.email : currentUser.email || '',
    }));
  }, [currentUser]);

  // Support deep linking via /blog#ask-petbhai-title
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#ask-petbhai-title') {
      const target = document.getElementById('ask-petbhai-title');
      if (target) {
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setFetchError(null);
    const localSaved = readStoredQuestions();

    try {
      const serverQuestions = await apiRequest<VisitorQuestion[]>('/questions');
      const cleanServer = Array.isArray(serverQuestions)
        ? serverQuestions.filter((q) => q && q.status !== 'rejected')
        : [];
      const merged = mergeQuestionLists(cleanServer, localSaved);
      setQuestions(merged);

      // Keep locally saved submissions refreshed with server answers/counts
      if (localSaved.length > 0 && cleanServer.length > 0) {
        const serverMap = new Map(cleanServer.map((q) => [q.id, q]));
        const refreshedLocal = localSaved.map((lq) => {
          const match = serverMap.get(lq.id);
          return match
            ? {
                ...match,
                helpfulCount: Math.max(lq.helpfulCount || 0, match.helpfulCount || 0),
              }
            : lq;
        });
        saveStoredQuestions(refreshedLocal);
      }

      // Auto-expand the first published answered question so visitors immediately see an expert answer
      const firstAnswered = merged.find(
        (q) => q.status === 'answered' && Boolean(q.answer && q.answer.trim().length > 0)
      );
      if (firstAnswered) {
        setExpandedIds((prev) => {
          if (prev.size > 0) return prev;
          return new Set([firstAnswered.id]);
        });
      }
    } catch (err: unknown) {
      setFetchError(
        getErrorMessage(
          err,
          isBn
            ? 'সর্বশেষ প্রশ্নগুলো লোড করা যায়নি।'
            : 'Could not refresh the latest visitor questions right now.'
        )
      );
      setQuestions(localSaved);
    } finally {
      setLoadingQuestions(false);
    }
  }, [isBn]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const qText = form.question.trim();
    if (qText.length < 10) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে কমপক্ষে ১০ অক্ষরের বিস্তারিত প্রশ্ন লিখুন।'
          : 'Please enter a question with at least 10 characters so our pet care team can answer it well.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        topic: form.topic,
        question: qText,
      };

      const data = await apiRequest<SubmitQuestionResponse>('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const createdQuestion: VisitorQuestion = data?.question
        ? {
            ...data.question,
            helpfulCount: data.question.helpfulCount ?? 0,
          }
        : {
            id: Date.now(),
            name: payload.name || 'Pet Parent',
            topic: payload.topic,
            question: payload.question,
            createdAt: new Date().toISOString(),
            status: 'pending',
            helpfulCount: 0,
          };

      const updatedLocal = [
        createdQuestion,
        ...readStoredQuestions().filter((item) => item.id !== createdQuestion.id),
      ];
      saveStoredQuestions(updatedLocal);

      setQuestions((prev) => [
        createdQuestion,
        ...prev.filter((item) => item.id !== createdQuestion.id),
      ]);
      setExpandedIds((prev) => new Set(prev).add(createdQuestion.id));
      if (activeTopic !== 'All' && !matchesTopicFilter(createdQuestion.topic, activeTopic)) {
        setActiveTopic('All');
      }

      setLastSubmitted(createdQuestion);
      setSubmitted(true);
      setForm({
        name: currentUser?.name || form.name.trim(),
        email: currentUser?.email || form.email.trim(),
        topic: 'Dog Care',
        question: '',
      });
    } catch (err: unknown) {
      setErrorMessage(
        getErrorMessage(
          err,
          isBn
            ? 'প্রশ্নটি জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
            : 'Unable to submit your question. Please try again in a moment.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleHelpful = async (q: VisitorQuestion) => {
    if (helpfulPendingId === q.id) return;

    const alreadyVoted = helpfulVotedIds.has(q.id);
    const alreadySynced = helpfulSyncedIds.has(q.id);
    const currentCount = q.helpfulCount || 0;

    if (alreadyVoted) {
      // Clean local toggle-off without inflating backend counts
      const nextVoted = new Set(helpfulVotedIds);
      nextVoted.delete(q.id);
      setHelpfulVotedIds(nextVoted);
      saveNumberSet(HELPFUL_VOTES_KEY, nextVoted);

      const decremented = Math.max(0, currentCount - 1);
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, helpfulCount: decremented } : item))
      );
      return;
    }

    // Optimistically mark helpful (+1)
    const nextVoted = new Set(helpfulVotedIds);
    nextVoted.add(q.id);
    setHelpfulVotedIds(nextVoted);
    saveNumberSet(HELPFUL_VOTES_KEY, nextVoted);

    const optimisticCount = currentCount + 1;
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, helpfulCount: optimisticCount } : item))
    );

    const localSaved = readStoredQuestions();
    if (localSaved.some((item) => item.id === q.id)) {
      saveStoredQuestions(
        localSaved.map((item) =>
          item.id === q.id ? { ...item, helpfulCount: optimisticCount } : item
        )
      );
    }

    // Only call backend POST once per browser to keep counts honest
    if (alreadySynced) return;

    setHelpfulPendingId(q.id);
    try {
      const res = await apiRequest<HelpfulQuestionResponse>(`/questions/${q.id}/helpful`, {
        method: 'POST',
      });

      const serverCount =
        typeof res?.helpfulCount === 'number'
          ? res.helpfulCount
          : typeof res?.question?.helpfulCount === 'number'
            ? res.question.helpfulCount
            : optimisticCount;

      const nextSynced = new Set(helpfulSyncedIds);
      nextSynced.add(q.id);
      setHelpfulSyncedIds(nextSynced);
      saveNumberSet(HELPFUL_SYNCED_KEY, nextSynced);

      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id
            ? {
                ...item,
                ...(res?.question || {}),
                helpfulCount: Math.max(serverCount, optimisticCount),
              }
            : item
        )
      );
    } catch {
      // Keep local optimistic vote gracefully if offline or ephemeral server reset
    } finally {
      setHelpfulPendingId(null);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => matchesTopicFilter(q.topic, activeTopic));
  }, [questions, activeTopic]);

  const visibleQuestions = showAllQuestions
    ? filteredQuestions
    : filteredQuestions.slice(0, INITIAL_VISIBLE_QUESTIONS);

  const answeredCount = useMemo(
    () => questions.filter((q) => q.status === 'answered').length,
    [questions]
  );

  return (
    <section aria-labelledby="ask-petbhai-title" className="my-12 md:my-16 scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 dark:from-amber-900/20 dark:via-zinc-900/70 dark:to-orange-950/20 border border-amber-500/20 dark:border-amber-500/15 shadow-xl p-5 sm:p-6 md:p-10 backdrop-blur-xl">
        {/* Decorative accents */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm font-semibold mb-3">
              <span>🐾</span>
              <span>{isBn ? 'পেটভাই ভিজিটর প্রশ্নোত্তর হাব' : 'PetBhai Visitor Q&A Hub'}</span>
            </div>
            <h2
              id="ask-petbhai-title"
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight scroll-mt-28"
            >
              {isBn
                ? 'আপনার পোষা প্রাণী সম্পর্কে কোনো প্রশ্ন আছে?'
                : 'Have a Question About Your Pet?'}
            </h2>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              {isBn
                ? 'খাবার, স্বাস্থ্য বা আচরণ সম্পর্কিত যেকোনো প্রশ্ন করুন। আমাদের পেটভাই কেয়ার টিম আপনার প্রশ্ন পর্যালোচনা করে নির্ভরযোগ্য উত্তর এবং প্রাসঙ্গিক ব্লগ গাইড শেয়ার করবে!'
                : 'Ask anything about pet nutrition, health, grooming, or training. Our PetBhai care team reviews every question, posts verified answers here, and links helpful in-depth guides.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Question Submission Form */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900/95 rounded-2xl p-5 sm:p-6 md:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-lg">
              {submitted && lastSubmitted ? (
                <div className="py-3 space-y-5 animate-fade-in">
                  <div className="text-center space-y-2.5">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                      ✅
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {isBn ? 'ধন্যবাদ! আপনার প্রশ্ন জমা হয়েছে' : 'Question Received!'}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                      {isBn
                        ? 'পেটভাই টিম আপনার প্রশ্নটি রিভিউ তালিকায় যুক্ত করেছে এবং নিচে ভিজিটরদের প্রশ্ন তালিকায় এটি যুক্ত হয়েছে।'
                        : 'The PetBhai team has queued your question for review. It is now visible in the Questions by Visitors feed!'}
                    </p>
                  </div>

                  {/* Submitted Question Summary */}
                  <div className="rounded-xl bg-amber-50/80 dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200">
                        <span>{getTopicMeta(lastSubmitted.topic).icon}</span>
                        <span>
                          {isBn
                            ? getTopicMeta(lastSubmitted.topic).labelBn
                            : getTopicMeta(lastSubmitted.topic).labelEn}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {isBn ? 'পর্যালোচনাধীন' : 'Queued for Review'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      "{lastSubmitted.question}"
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isBn ? 'প্রশ্নকর্তা:' : 'Asked by:'}{' '}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {lastSubmitted.name}
                      </span>
                    </p>
                  </div>

                  {/* Recommended Blog Guide Card if backend matched an article */}
                  {lastSubmitted.answeredBlogSlug && (
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:from-emerald-950/40 dark:to-zinc-800/90 border border-emerald-200 dark:border-emerald-800/60 p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <span>📖</span>
                        <span>
                          {isBn ? 'আপনার জন্য প্রস্তাবিত ব্লগ গাইড' : 'Recommended Blog Guide'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                        {lastSubmitted.answeredBlogTitle ||
                          (isBn
                            ? 'আপনার প্রশ্নের সাথে সম্পর্কিত বিস্তারিত গাইড পড়ুন'
                            : 'Read our related PetBhai care guide right away')}
                      </p>
                      <Link
                        to={`/blog/${lastSubmitted.answeredBlogSlug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        <span>{isBn ? 'সম্পূর্ণ ব্লগ গাইড পড়ুন →' : 'Read Full Blog Guide →'}</span>
                      </Link>
                    </div>
                  )}

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setLastSubmitted(null);
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      {isBn ? 'আরেকটি প্রশ্ন করুন' : 'Ask Another Question'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>✍️</span>
                      <span>{isBn ? 'আপনার প্রশ্ন লিখুন' : 'Ask the PetBhai Team'}</span>
                    </h3>
                    {currentUser && (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                        {isBn ? `লগইন: ${currentUser.name}` : `Signed in as ${currentUser.name}`}
                      </span>
                    )}
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* Topic selection pills */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
                      {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Topic'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FORM_TOPICS.map((t) => {
                        const isSelected = form.topic === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, topic: t.id }))}
                            className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border active:scale-95 ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-zinc-700/70'
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{isBn ? t.labelBn : t.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question textarea */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="ask-petbhai-question"
                        className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                      >
                        {isBn ? 'আপনার প্রশ্ন *' : 'Your Question *'}
                      </label>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {form.question.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="ask-petbhai-question"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      value={form.question}
                      onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                      placeholder={
                        isBn
                          ? 'যেমন: গরমের দিনে দেশি বিড়ালের ডিহাইড্রেশন কীভাবে প্রতিরোধ করব? অথবা ২ মাসের কুকুরছানাকে কী কী টিকা দিতে হবে?'
                          : 'e.g., How can I keep my indoor cat cool in hot Dhaka weather? Or when should I start rabies vaccination for my puppy?'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base sm:text-sm transition-all"
                    />
                  </div>

                  {/* Optional user details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="ask-petbhai-name"
                        className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1"
                      >
                        {isBn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                      </label>
                      <input
                        id="ask-petbhai-name"
                        type="text"
                        maxLength={80}
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={
                          isBn ? 'যেমন: সাকিব / টমির আব্বু' : 'e.g., Alex / Bruno’s parent'
                        }
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ask-petbhai-email"
                        className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1"
                      >
                        {isBn ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                      </label>
                      <input
                        id="ask-petbhai-email"
                        type="email"
                        maxLength={120}
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || form.question.trim().length < 10}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-slate-200 disabled:text-zinc-400 disabled:cursor-not-allowed dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin text-base">⏳</span>
                        <span>{isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting Question...'}</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>{isBn ? 'প্রশ্ন জমা দিন' : 'Submit My Question'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Interactive Questions by Visitors Explorer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <span className="text-xl">💬</span>
                  <h3 className="font-extrabold text-base md:text-lg tracking-tight">
                    {isBn ? 'ভিজিটরদের প্রশ্ন ও উত্তর' : 'Questions by Visitors'}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60">
                    {questions.length}
                  </span>
                </div>

                {answeredCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                    ✅ {answeredCount} {isBn ? 'টি উত্তরিত' : 'Answered by PetBhai'}
                  </span>
                )}
              </div>

              {/* Topic Filter Pills */}
              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label={isBn ? 'বিষয় অনুযায়ী ফিল্টার' : 'Filter visitor questions by topic'}
              >
                {FILTER_TOPICS.map((topic) => {
                  const isActive = activeTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setActiveTopic(topic.id);
                        setShowAllQuestions(false);
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all border ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-amber-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-amber-500 shadow-sm'
                          : 'bg-white/90 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-500/60 hover:text-orange-600 dark:hover:text-amber-300'
                      }`}
                    >
                      <span>{topic.icon}</span>
                      <span>{isBn ? topic.labelBn : topic.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {fetchError && questions.length === 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-zinc-900/90 border border-amber-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <span>{fetchError}</span>
                  <button
                    type="button"
                    onClick={() => void loadQuestions()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shrink-0"
                  >
                    {isBn ? 'আবার চেষ্টা' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Questions List */}
              {loadingQuestions && questions.length === 0 ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading visitor questions">
                  {[0, 1, 2].map((skeletonIdx) => (
                    <div
                      key={skeletonIdx}
                      className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 animate-pulse space-y-2.5"
                    >
                      <div className="flex justify-between">
                        <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : visibleQuestions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-2">
                  <div className="text-3xl">🐾</div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {activeTopic === 'All'
                      ? isBn
                        ? 'এখনো কোনো প্রশ্ন নেই — প্রথম প্রশ্নটি আপনি করুন!'
                        : 'No visitor questions yet — be the first to ask!'
                      : isBn
                        ? 'এই বিষয়ে এখনো কোনো প্রশ্ন নেই।'
                        : `No questions in ${activeTopic} yet — ask yours on the left!`}
                  </p>
                  {activeTopic !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setActiveTopic('All')}
                      className="mt-1 text-xs font-semibold text-orange-600 dark:text-amber-400 hover:underline"
                    >
                      {isBn ? 'সব প্রশ্ন দেখুন' : 'Show all topics'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleQuestions.map((q) => {
                    const topicMeta = getTopicMeta(q.topic);
                    const isAnswered = q.status === 'answered';
                    const hasAnswer = isAnswered && Boolean(q.answer && q.answer.trim().length > 0);
                    const isExpanded = expandedIds.has(q.id);
                    const hasVotedHelpful = helpfulVotedIds.has(q.id);
                    const dateLabel = formatDateLabel(q.createdAt, isBn);

                    return (
                      <article
                        key={q.id}
                        className="rounded-2xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-amber-500/40 transition-colors overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Top Meta: Topic + Status Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60">
                              <span>{topicMeta.icon}</span>
                              <span>{isBn ? topicMeta.labelBn : topicMeta.labelEn}</span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isAnswered
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60'
                                  : 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/60'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAnswered ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'
                                }`}
                              />
                              {isAnswered
                                ? isBn
                                  ? 'উত্তরিত'
                                  : 'Answered'
                                : isBn
                                  ? 'পর্যালোচনাধীন'
                                  : 'Under Review'}
                            </span>
                          </div>

                          {/* Question Text (clickable to expand/collapse) */}
                          <button
                            type="button"
                            onClick={() => toggleExpanded(q.id)}
                            aria-expanded={isExpanded}
                            className="w-full text-left group focus:outline-none"
                          >
                            <p className="text-sm md:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                              "{q.question}"
                            </p>
                          </button>

                          {/* Asker & Date Row */}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>
                              {isBn ? 'প্রশ্নকর্তা:' : 'Asked by:'}{' '}
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {q.name || (isBn ? 'পেট প্যারেন্ট' : 'Pet Parent')}
                              </span>
                              {dateLabel && <span className="ml-1.5">• {dateLabel}</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleExpanded(q.id)}
                              className="font-semibold text-orange-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>
                                {isExpanded
                                  ? isBn
                                    ? 'লুকান'
                                    : 'Hide details'
                                  : hasAnswer
                                    ? isBn
                                      ? 'উত্তর দেখুন'
                                      : 'View Answer'
                                    : isBn
                                      ? 'স্ট্যাটাস দেখুন'
                                      : 'View Status'}
                              </span>
                              <span aria-hidden="true">{isExpanded ? '▴' : '▾'}</span>
                            </button>
                          </div>

                          {/* Expandable Official PetBhai Team Answer Panel */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5 animate-fade-in">
                              {hasAnswer ? (
                                <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 p-3.5 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                                      <span>🐾</span>
                                      <span>
                                        {q.answeredBy ||
                                          (isBn ? 'পেটভাই কেয়ার টিম' : 'PetBhai Care Team')}
                                      </span>
                                    </span>
                                    {q.answeredAt && (
                                      <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                                        {formatDateLabel(q.answeredAt, isBn)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                    {q.answer}
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-amber-50/70 dark:bg-zinc-800/70 border border-amber-200/60 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                  {isBn
                                    ? 'আমাদের পেটভাই কেয়ার টিম প্রশ্নটি পর্যালোচনা করছে। যাচাইকৃত উত্তর খুব শীঘ্রই এখানে যুক্ত করা হবে।'
                                    : 'Our PetBhai pet care team is reviewing this question and will post a verified answer right here soon.'}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer Actions: Helpful Vote + Full Blog Guide Link */}
                          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => void handleToggleHelpful(q)}
                              disabled={helpfulPendingId === q.id}
                              aria-pressed={hasVotedHelpful}
                              className={`min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border active:scale-95 ${
                                hasVotedHelpful
                                  ? 'bg-orange-500/15 dark:bg-amber-500/20 text-orange-700 dark:text-amber-300 border-orange-400/50 dark:border-amber-500/50'
                                  : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-orange-400 hover:text-orange-600 dark:hover:text-amber-300'
                              }`}
                            >
                              <span>👍</span>
                              <span>
                                {isBn ? 'উপকারী' : 'Helpful'} ({q.helpfulCount || 0})
                              </span>
                            </button>

                            {q.answeredBlogSlug && (
                              <Link
                                to={`/blog/${q.answeredBlogSlug}`}
                                title={q.answeredBlogTitle || undefined}
                                className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
                              >
                                <span>
                                  {isBn ? 'সম্পূর্ণ ব্লগ গাইড পড়ুন →' : 'Read Full Blog Guide →'}
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {/* Show more / less toggle */}
                  {filteredQuestions.length > INITIAL_VISIBLE_QUESTIONS && (
                    <button
                      type="button"
                      onClick={() => setShowAllQuestions((prev) => !prev)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors"
                    >
                      {showAllQuestions
                        ? isBn
                          ? 'কম দেখুন ▴'
                          : 'Show Fewer Questions ▴'
                        : isBn
                          ? `আরও ${filteredQuestions.length - INITIAL_VISIBLE_QUESTIONS}টি প্রশ্ন দেখুন ▾`
                          : `Show ${filteredQuestions.length - INITIAL_VISIBLE_QUESTIONS} More Questions ▾`}
                    </button>
                  )}
                </div>
              )}

              {/* Community Info Note */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                <span className="text-base leading-none">ℹ️</span>
                <p className="leading-relaxed">
                  {isBn
                    ? 'ভিজিটরদের প্রশ্নগুলোর উত্তর সরাসরি এখানে যুক্ত হয় এবং জনপ্রিয় প্রশ্ন নিয়ে আমাদের ব্লগে বিস্তারিত গাইড প্রকাশ করা হয়।'
                    : 'PetBhai team answers appear directly here, and popular visitor questions inspire full step-by-step blog guides.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AskPetBhai;
