import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { apiRequest, ApiRequestError } from './apiClient';
import { safeSessionStorage, safeStorage } from '../lib/storage';
import { getBaselineReaders } from '../lib/articleUtils';

export { getBaselineReaders };

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
  isGuest?: boolean;
}

export interface EngagementState {
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

export interface ArticleEngagementSeed {
  id: string | number;
  views?: number;
  likeCount?: number;
  likedBy?: string[];
  commentCount?: number;
}

interface InternalEngagementRecord {
  viewCount: number;
  likeCount: number;
  likedBy: string[];
  commentCount: number;
  hasRemoteHydrated: boolean;
  pendingUnreconciledIncrement: number;
}

type SubscriberEntry = {
  userId: string | null;
  callback: (state: EngagementState, isLikedByMe: boolean) => void;
};

type CommentSubscriber = (comments: Comment[]) => void;

type MergeSource = 'seed' | 'remote-read' | 'view-increment-ack' | 'local';

// Shared in-memory stores and Pub/Sub listeners so all cards & detail views stay in sync instantaneously
const engagementStore = new Map<string, InternalEngagementRecord>();
const subscribers = new Map<string, Set<SubscriberEntry>>();
const firestoreUnsubscribers = new Map<string, () => void>();
const firestoreUnsubTimers = new Map<string, ReturnType<typeof setTimeout>>();

const commentsStore = new Map<string, Comment[]>();
const commentSubscribers = new Map<string, Set<CommentSubscriber>>();
const firestoreCommentUnsubscribers = new Map<string, () => void>();
const firestoreCommentUnsubTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Runtime Set guarding StrictMode double-invocations from double-counting or cancelling view increments
const incrementedInRuntime = new Set<string>();

let initialBatchFetchPromise: Promise<void> | null = null;
let lastBatchFetchAt = 0;
const BATCH_FETCH_TTL_MS = 15_000;
const FIRESTORE_UNSUB_DEBOUNCE_MS = 1000;
const MAX_CACHED_COMMENTS = 50;

const GUEST_ID_STORAGE_KEY = 'petbhai_guest_id';

export const getExistingGuestId = (): string | null => {
  const existing = safeStorage.getItem(GUEST_ID_STORAGE_KEY)?.trim();
  return existing && existing.startsWith('guest_') ? existing : null;
};

export const getOrCreateGuestId = (): string => {
  const existing = getExistingGuestId();
  if (existing) return existing;

  const generated =
    typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function'
      ? `guest_${window.crypto.randomUUID().slice(0, 12)}`
      : `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  safeStorage.setItem(GUEST_ID_STORAGE_KEY, generated);
  return generated;
};

const getLocalViewedDelta = (key: string): number => {
  const raw = safeStorage.getItem(`petbhai_viewed_delta_${key}`);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const setLocalViewedDelta = (key: string, delta: number): void => {
  if (Number.isFinite(delta) && delta >= 0) {
    safeStorage.setItem(`petbhai_viewed_delta_${key}`, String(Math.floor(delta)));
  }
};

const getLocalStoredViews = (key: string): number => {
  const raw = safeStorage.getItem(`article_views_${key}`);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const setLocalStoredViews = (key: string, count: number): void => {
  if (Number.isFinite(count) && count >= 0) {
    safeStorage.setItem(`article_views_${key}`, String(Math.floor(count)));
  }
};

const getLocalStoredComments = (key: string): Comment[] => {
  const raw = safeStorage.getItem(`petbhai_article_comments_${key}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Comment =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          typeof item.userName === 'string'
      )
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
};

const setLocalStoredComments = (key: string, comments: Comment[]): void => {
  try {
    safeStorage.setItem(
      `petbhai_article_comments_${key}`,
      JSON.stringify(comments.slice(0, MAX_CACHED_COMMENTS))
    );
  } catch {
    // ignore storage quota issues
  }
};

const getFloorViews = (key: string): number => {
  const baseline = getBaselineReaders(key);
  const localDelta = getLocalViewedDelta(key);
  const localViews = getLocalStoredViews(key);
  return Math.max(baseline + localDelta, localViews);
};

const getOrCreateRecord = (key: string): InternalEngagementRecord => {
  const floor = getFloorViews(key);
  const existing = engagementStore.get(key);
  if (existing) {
    if (floor > existing.viewCount) {
      existing.viewCount = floor;
    }
    return existing;
  }

  const storedComments = getLocalStoredComments(key);
  const initial: InternalEngagementRecord = {
    viewCount: floor,
    likeCount: 0,
    likedBy: [],
    commentCount: storedComments.length,
    hasRemoteHydrated: false,
    pendingUnreconciledIncrement: 0,
  };
  engagementStore.set(key, initial);
  return initial;
};

/**
 * Synchronously returns the best known reader count for an article
 * (at least deterministic baseline + local browser delta).
 */
export const getArticleViews = (articleId: string | number): number => {
  if (articleId === '' || articleId === null || articleId === undefined) return 0;
  return getOrCreateRecord(String(articleId)).viewCount;
};

/**
 * Synchronously returns the initial engagement snapshot for an article
 * so UI components never flash 0 readers before effects run.
 */
export const getInitialEngagementState = (articleId: string | number): EngagementState => {
  if (articleId === '' || articleId === null || articleId === undefined) {
    return { viewCount: 0, likeCount: 0, commentCount: 0 };
  }
  const record = getOrCreateRecord(String(articleId));
  return {
    viewCount: record.viewCount,
    likeCount: record.likeCount,
    commentCount: record.commentCount,
  };
};

const notifySubscribers = (key: string) => {
  const subs = subscribers.get(key);
  if (!subs || subs.size === 0) return;

  const record = getOrCreateRecord(key);
  const stateSnapshot: EngagementState = {
    viewCount: record.viewCount,
    likeCount: record.likeCount,
    commentCount: record.commentCount,
  };

  subs.forEach((entry) => {
    const isLikedByMe = entry.userId ? record.likedBy.includes(entry.userId) : false;
    try {
      entry.callback(stateSnapshot, isLikedByMe);
    } catch (err) {
      console.warn('Error in engagement subscriber callback:', err);
    }
  });
};

const notifyCommentSubscribers = (key: string) => {
  const subs = commentSubscribers.get(key);
  if (!subs || subs.size === 0) return;
  const list = commentsStore.get(key) || getLocalStoredComments(key);
  const snapshot = [...list];
  subs.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (err) {
      console.warn('Error in comment subscriber callback:', err);
    }
  });
};

const mergeRecord = (
  key: string,
  incoming: Partial<
    Pick<InternalEngagementRecord, 'viewCount' | 'likeCount' | 'likedBy' | 'commentCount'>
  >,
  options?: {
    authoritativeLikes?: boolean;
    authoritativeComments?: boolean;
    source?: MergeSource;
  }
) => {
  const current = getOrCreateRecord(key);
  const source: MergeSource = options?.source || 'remote-read';
  const baseline = getBaselineReaders(key);
  const localDelta = getLocalViewedDelta(key);
  const floor = Math.max(baseline + localDelta, getLocalStoredViews(key));

  const rawIncomingViews =
    typeof incoming.viewCount === 'number' &&
    Number.isFinite(incoming.viewCount) &&
    incoming.viewCount >= 0
      ? Math.floor(incoming.viewCount)
      : undefined;

  let reconciledIncomingViews = rawIncomingViews ?? 0;

  if (source === 'view-increment-ack') {
    // The backend POST /view response already includes our +1 increment
    current.hasRemoteHydrated = true;
    current.pendingUnreconciledIncrement = 0;
  } else if (source === 'remote-read' && rawIncomingViews !== undefined) {
    // If an increment occurred locally before the first remote hydration finished,
    // add +1 onto the fetched remote count ONCE so the user's view is never swallowed.
    if (current.pendingUnreconciledIncrement > 0) {
      reconciledIncomingViews = rawIncomingViews + current.pendingUnreconciledIncrement;
      current.pendingUnreconciledIncrement = 0;
    }
    current.hasRemoteHydrated = true;
  }

  const nextViewCount = Math.max(current.viewCount, reconciledIncomingViews, floor);

  const nextLikeCount = options?.authoritativeLikes
    ? typeof incoming.likeCount === 'number' && incoming.likeCount >= 0
      ? incoming.likeCount
      : current.likeCount
    : Math.max(
        current.likeCount,
        typeof incoming.likeCount === 'number' && incoming.likeCount >= 0 ? incoming.likeCount : 0
      );

  const nextLikedBy = Array.isArray(incoming.likedBy) ? incoming.likedBy : current.likedBy;

  const nextCommentCount = options?.authoritativeComments
    ? typeof incoming.commentCount === 'number' && incoming.commentCount >= 0
      ? incoming.commentCount
      : current.commentCount
    : Math.max(
        current.commentCount,
        typeof incoming.commentCount === 'number' && incoming.commentCount >= 0
          ? incoming.commentCount
          : 0
      );

  current.viewCount = nextViewCount;
  current.likeCount = nextLikeCount;
  current.likedBy = nextLikedBy;
  current.commentCount = nextCommentCount;

  if (nextViewCount > 0) {
    setLocalStoredViews(key, nextViewCount);
  }

  notifySubscribers(key);
};

/**
 * Seeds engagement counts from loaded articles (API or session cache) so list cards
 * immediately reflect backend counts without overriding higher live counts or pending increments.
 */
export const seedArticlesEngagement = (articles: ArticleEngagementSeed[]): void => {
  if (!Array.isArray(articles)) return;
  for (const article of articles) {
    if (!article || article.id === '' || article.id === null || article.id === undefined) {
      continue;
    }
    const key = String(article.id);
    mergeRecord(
      key,
      {
        viewCount:
          typeof article.views === 'number' && Number.isFinite(article.views)
            ? article.views
            : undefined,
        likeCount:
          typeof article.likeCount === 'number' && Number.isFinite(article.likeCount)
            ? article.likeCount
            : undefined,
        likedBy: Array.isArray(article.likedBy) ? article.likedBy : undefined,
        commentCount:
          typeof article.commentCount === 'number' && Number.isFinite(article.commentCount)
            ? article.commentCount
            : undefined,
      },
      { source: 'seed' }
    );
  }
};

/**
 * Hydrates engagement counts for all articles from the backend API in a single batched request.
 */
const ensureBackendEngagementHydrated = (): Promise<void> => {
  const now = Date.now();
  if (initialBatchFetchPromise && now - lastBatchFetchAt < BATCH_FETCH_TTL_MS) {
    return initialBatchFetchPromise;
  }

  lastBatchFetchAt = now;
  initialBatchFetchPromise = apiRequest<
    Record<
      string,
      { viewCount?: number; likeCount?: number; likedBy?: string[]; commentCount?: number }
    >
  >('/articles/engagement', { timeoutMs: 8000 })
    .then((data) => {
      if (!data || typeof data !== 'object') return;
      for (const [id, metrics] of Object.entries(data)) {
        if (metrics && typeof metrics === 'object') {
          mergeRecord(
            String(id),
            {
              viewCount: metrics.viewCount,
              likeCount: metrics.likeCount,
              likedBy: metrics.likedBy,
              commentCount: metrics.commentCount,
            },
            { source: 'remote-read' }
          );
        }
      }
    })
    .catch((err) => {
      console.warn('Backend engagement hydration fallback:', err);
    });

  return initialBatchFetchPromise;
};

// Helper to initialize article doc in Firestore if it doesn't exist
const ensureArticleDoc = async (articleId: string | number) => {
  if (!db) return;
  const key = String(articleId);
  const docRef = doc(db, 'articles', key);
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const current = getOrCreateRecord(key);
      await setDoc(
        docRef,
        {
          likeCount: current.likeCount || 0,
          likedBy: current.likedBy || [],
          commentCount: current.commentCount || 0,
          viewCount: Math.max(current.viewCount || 0, getBaselineReaders(key)),
        },
        { merge: true }
      );
    }
  } catch (e) {
    console.warn('Failed to initialize article doc:', e);
  }
};

/**
 * Toggles a like for the given user across local Pub/Sub, Backend API, and Firestore.
 */
export const toggleLike = async (
  articleId: string | number,
  userId: string,
  isCurrentlyLiked: boolean
) => {
  const key = String(articleId);
  const record = getOrCreateRecord(key);

  // Optimistic update in shared store
  const likedSet = new Set(record.likedBy);
  if (isCurrentlyLiked) {
    likedSet.delete(userId);
    record.likeCount = Math.max(0, record.likeCount - 1);
  } else {
    likedSet.add(userId);
    record.likeCount = record.likeCount + 1;
  }
  record.likedBy = Array.from(likedSet);
  notifySubscribers(key);

  let backendSucceeded = false;
  let backendFirestoreSynced = false;
  try {
    const res = await apiRequest<{
      viewCount: number;
      likeCount: number;
      likedBy: string[];
      commentCount: number;
      firestoreSynced?: boolean;
    }>(`/articles/${encodeURIComponent(key)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res) {
      backendSucceeded = true;
      backendFirestoreSynced = Boolean(res.firestoreSynced);
      mergeRecord(
        key,
        {
          viewCount: res.viewCount,
          likeCount: res.likeCount,
          likedBy: res.likedBy,
          commentCount: res.commentCount,
        },
        { authoritativeLikes: true, source: 'remote-read' }
      );
    }
  } catch (err) {
    console.warn('Backend toggleLike fallback:', err);
  }

  if (!db || backendFirestoreSynced) return;
  const docRef = doc(db, 'articles', key);

  try {
    await ensureArticleDoc(key);
    if (isCurrentlyLiked) {
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId),
        likeCount: increment(-1),
      });
    } else {
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId),
        likeCount: increment(1),
      });
    }
  } catch (e) {
    if (!backendSucceeded) {
      console.error('Error toggling like:', e);
      throw e;
    }
  }
};

const mergeCommentsList = (
  existing: Comment[],
  incoming: Comment[],
  limitCount?: number
): Comment[] => {
  const byId = new Map<string, Comment>();
  for (const item of existing) {
    if (item && item.id) byId.set(item.id, item);
  }
  for (const item of incoming) {
    if (item && item.id) byId.set(item.id, item);
  }
  const sorted = Array.from(byId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return typeof limitCount === 'number' && limitCount > 0 ? sorted.slice(0, limitCount) : sorted;
};

/**
 * Adds a new article comment/question via the backend API (supporting both authenticated users
 * and guest visitors), updates in-memory & safeStorage caches immediately, treats client
 * Firestore writes as non-fatal progressive enhancement, and always throws a real Error on failure.
 */
export const addComment = async (
  articleId: string | number,
  userId: string,
  userName: string,
  text: string
): Promise<Comment> => {
  if (articleId === '' || articleId === null || articleId === undefined) {
    throw new Error('Invalid article ID.');
  }
  const cleanText = typeof text === 'string' ? text.trim() : '';
  if (cleanText.length < 2) {
    throw new Error('Comment must be at least 2 characters long.');
  }
  const cleanUserName =
    typeof userName === 'string' && userName.trim() ? userName.trim().slice(0, 80) : 'Pet Parent';
  const cleanUserId =
    typeof userId === 'string' && userId.trim() ? userId.trim() : getOrCreateGuestId();

  const key = String(articleId);
  let createdComment: Comment | null = null;
  let serverCommentCount: number | undefined;
  let backendError: unknown = null;

  try {
    const res = await apiRequest<{
      success?: boolean;
      comment?: Comment;
      commentCount?: number;
    }>(`/articles/${encodeURIComponent(key)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: cleanUserId,
        userName: cleanUserName,
        text: cleanText,
      }),
    });

    if (res && res.comment && res.comment.id) {
      createdComment = res.comment;
      serverCommentCount = res.commentCount;
    } else {
      throw new Error('Unexpected response from server while posting comment.');
    }
  } catch (err) {
    // Validation, auth, or rate-limit errors (4xx) must surface directly to the user
    if (
      err instanceof ApiRequestError &&
      err.statusCode &&
      err.statusCode >= 400 &&
      err.statusCode < 500
    ) {
      throw err;
    }
    backendError = err;
    console.warn('Backend addComment failed, checking Firestore fallback:', err);
  }

  // Non-fatal progressive enhancement if backend succeeded, OR fallback write if backend was unreachable
  if (createdComment) {
    const existing = commentsStore.get(key) || getLocalStoredComments(key);
    const updatedList = mergeCommentsList(existing, [createdComment]);
    commentsStore.set(key, updatedList);
    setLocalStoredComments(key, updatedList);
    notifyCommentSubscribers(key);

    const record = getOrCreateRecord(key);
    mergeRecord(
      key,
      {
        commentCount:
          typeof serverCommentCount === 'number'
            ? Math.max(serverCommentCount, updatedList.length)
            : Math.max(record.commentCount + 1, updatedList.length),
      },
      { source: 'local' }
    );

    if (db) {
      const commentRef = doc(db, 'articles', key, 'comments', createdComment.id);
      void setDoc(
        commentRef,
        {
          userId: createdComment.userId,
          userName: createdComment.userName,
          text: createdComment.text,
          createdAt: createdComment.createdAt,
          ...(typeof createdComment.isGuest === 'boolean'
            ? { isGuest: createdComment.isGuest }
            : {}),
        },
        { merge: true }
      ).catch((fsErr) => {
        console.warn('Non-fatal Firestore comment progressive sync error:', fsErr);
      });
    }

    return createdComment;
  }

  // Fallback path when backend failed due to network/5xx and client Firestore is available
  if (db) {
    try {
      const fallbackId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const fallbackComment: Comment = {
        id: fallbackId,
        userId: cleanUserId,
        userName: cleanUserName,
        text: cleanText,
        createdAt: Date.now(),
        isGuest: cleanUserId.startsWith('guest_'),
      };

      const articleRef = doc(db, 'articles', key);
      await ensureArticleDoc(key);
      await setDoc(doc(db, 'articles', key, 'comments', fallbackId), {
        userId: fallbackComment.userId,
        userName: fallbackComment.userName,
        text: fallbackComment.text,
        createdAt: fallbackComment.createdAt,
        isGuest: fallbackComment.isGuest,
      });
      await updateDoc(articleRef, { commentCount: increment(1) }).catch(() => {});

      const existing = commentsStore.get(key) || getLocalStoredComments(key);
      const updatedList = mergeCommentsList(existing, [fallbackComment]);
      commentsStore.set(key, updatedList);
      setLocalStoredComments(key, updatedList);
      notifyCommentSubscribers(key);

      const record = getOrCreateRecord(key);
      mergeRecord(
        key,
        { commentCount: Math.max(record.commentCount + 1, updatedList.length) },
        { source: 'local' }
      );

      return fallbackComment;
    } catch (fsErr) {
      console.error('Both backend and Firestore addComment failed:', fsErr);
    }
  }

  if (backendError instanceof Error) {
    throw backendError;
  }
  throw new Error('Could not post your comment. Please try again.');
};

/**
 * Deletes a comment via backend API + local cache + progressive Firestore cleanup.
 * Always throws a real Error if deletion fails.
 */
export const deleteComment = async (
  articleId: string | number,
  commentId: string,
  requesterUserId?: string
): Promise<void> => {
  if (articleId === '' || articleId === null || articleId === undefined || !commentId) {
    throw new Error('Invalid article or comment ID.');
  }

  const key = String(articleId);
  const querySuffix = requesterUserId ? `?userId=${encodeURIComponent(requesterUserId)}` : '';

  let backendSucceeded = false;
  let serverCommentCount: number | undefined;
  let backendError: unknown = null;

  try {
    const res = await apiRequest<{
      success?: boolean;
      commentId?: string;
      commentCount?: number;
    }>(
      `/articles/${encodeURIComponent(key)}/comments/${encodeURIComponent(commentId)}${querySuffix}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    backendSucceeded = true;
    serverCommentCount = res?.commentCount;
  } catch (err) {
    if (
      err instanceof ApiRequestError &&
      err.statusCode &&
      err.statusCode >= 400 &&
      err.statusCode < 500
    ) {
      throw err;
    }
    backendError = err;
    console.warn('Backend deleteComment failed, checking Firestore fallback:', err);
  }

  if (backendSucceeded) {
    const existing = commentsStore.get(key) || getLocalStoredComments(key);
    const updatedList = existing.filter((item) => item.id !== commentId);
    commentsStore.set(key, updatedList);
    setLocalStoredComments(key, updatedList);
    notifyCommentSubscribers(key);

    const record = getOrCreateRecord(key);
    mergeRecord(
      key,
      {
        commentCount:
          typeof serverCommentCount === 'number'
            ? serverCommentCount
            : Math.max(0, record.commentCount - 1),
      },
      { authoritativeComments: true, source: 'local' }
    );

    if (db) {
      void deleteDoc(doc(db, 'articles', key, 'comments', commentId)).catch((fsErr) => {
        console.warn('Non-fatal Firestore comment delete progressive sync error:', fsErr);
      });
    }
    return;
  }

  if (db) {
    try {
      const commentRef = doc(db, 'articles', key, 'comments', commentId);
      const articleRef = doc(db, 'articles', key);
      await deleteDoc(commentRef);
      await updateDoc(articleRef, { commentCount: increment(-1) }).catch(() => {});

      const existing = commentsStore.get(key) || getLocalStoredComments(key);
      const updatedList = existing.filter((item) => item.id !== commentId);
      commentsStore.set(key, updatedList);
      setLocalStoredComments(key, updatedList);
      notifyCommentSubscribers(key);

      const record = getOrCreateRecord(key);
      mergeRecord(
        key,
        { commentCount: Math.max(0, record.commentCount - 1) },
        { authoritativeComments: true, source: 'local' }
      );
      return;
    } catch (fsErr) {
      console.error('Both backend and Firestore deleteComment failed:', fsErr);
    }
  }

  if (backendError instanceof Error) {
    throw backendError;
  }
  throw new Error('Could not delete comment. Please try again.');
};

/**
 * Increments the view count once per session and immediately updates all active UI subscribers,
 * persistent local delta, backend persistence, and Cloud Firestore without race-condition loss.
 */
export const incrementViews = async (articleId: string | number) => {
  if (articleId === '' || articleId === null || articleId === undefined) return;
  const key = String(articleId);
  const record = getOrCreateRecord(key);

  const viewedKey = `petbhai_v3_viewed_${key}`;
  const alreadyViewed =
    incrementedInRuntime.has(key) || safeSessionStorage.getItem(viewedKey) === 'true';

  if (alreadyViewed) {
    incrementedInRuntime.add(key);
    notifySubscribers(key);
    return;
  }

  // Mark immediately in both runtime Set and sessionStorage so StrictMode double-invocation
  // neither double-counts nor cancels the first increment
  incrementedInRuntime.add(key);
  safeSessionStorage.setItem(viewedKey, 'true');

  // Persist browser-level local delta so reloads or ephemeral backend restarts never drop this view
  const baseline = getBaselineReaders(key);
  const nextDelta = getLocalViewedDelta(key) + 1;
  setLocalViewedDelta(key, nextDelta);

  // Optimistic increment so the reader sees the count increase immediately
  const nextCount = Math.max(record.viewCount + 1, baseline + nextDelta);
  record.viewCount = nextCount;
  if (!record.hasRemoteHydrated) {
    record.pendingUnreconciledIncrement += 1;
  }
  setLocalStoredViews(key, nextCount);
  notifySubscribers(key);

  // Persist to backend API first (which awaits Firestore sync with timeout)
  let backendSucceeded = false;
  let backendFirestoreSynced = false;
  try {
    const res = await apiRequest<{
      viewCount: number;
      likeCount: number;
      likedBy: string[];
      commentCount: number;
      firestoreSynced?: boolean;
    }>(`/articles/${encodeURIComponent(key)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientViewCount: nextCount }),
    });

    if (res && typeof res.viewCount === 'number') {
      backendSucceeded = true;
      backendFirestoreSynced = Boolean(res.firestoreSynced);
      mergeRecord(
        key,
        {
          viewCount: res.viewCount,
          likeCount: res.likeCount,
          likedBy: res.likedBy,
          commentCount: res.commentCount,
        },
        { source: 'view-increment-ack' }
      );
    }
  } catch (err) {
    console.warn('Backend view increment fallback:', err);
  }

  // Client Firestore fallback / reconciliation (never double-increments when backend already synced)
  if (db && !backendFirestoreSynced) {
    const docRef = doc(db, 'articles', key);
    try {
      const snap = await getDoc(docRef);
      const fsViews =
        snap.exists() && typeof snap.data().viewCount === 'number' ? snap.data().viewCount : 0;

      if (backendSucceeded) {
        const targetViews = Math.max(record.viewCount, baseline + nextDelta);
        if (fsViews < targetViews) {
          await setDoc(docRef, { viewCount: targetViews }, { merge: true });
        }
      } else if (snap.exists() && fsViews >= baseline) {
        await updateDoc(docRef, { viewCount: increment(1) });
      } else {
        await setDoc(
          docRef,
          {
            viewCount: Math.max(record.viewCount, fsViews + 1, baseline + nextDelta),
            likeCount: record.likeCount,
            likedBy: record.likedBy,
            commentCount: record.commentCount,
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firestore view increment fallback:', e);
    }
  }
};

/**
 * Ensures a single shared Firestore listener is attached for a given articleId
 * while broadcasting updates to all subscribed components.
 */
const ensureFirestoreSubscription = (key: string) => {
  if (!db) return;

  // Cancel any pending debounced unsubscribe if a subscriber re-mounted within 1000ms
  const pendingTimer = firestoreUnsubTimers.get(key);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    firestoreUnsubTimers.delete(key);
  }

  if (firestoreUnsubscribers.has(key)) return;

  const docRef = doc(db, 'articles', key);
  const unsub = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fsViews = typeof data.viewCount === 'number' ? data.viewCount : 0;
        const current = getOrCreateRecord(key);

        mergeRecord(
          key,
          {
            viewCount: fsViews,
            likeCount: typeof data.likeCount === 'number' ? data.likeCount : 0,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
          },
          { authoritativeLikes: true, source: 'remote-read' }
        );

        // If Firestore doc has a lower view count than our reconciled count, sync it upward
        if (fsViews < current.viewCount && current.viewCount > 0) {
          setDoc(docRef, { viewCount: current.viewCount }, { merge: true }).catch(() => {});
        }
      } else {
        const current = getOrCreateRecord(key);
        if (current.viewCount > 0) {
          setDoc(
            docRef,
            {
              viewCount: current.viewCount,
              likeCount: current.likeCount,
              likedBy: current.likedBy,
              commentCount: current.commentCount,
            },
            { merge: true }
          ).catch(() => {});
        }
        notifySubscribers(key);
      }
    },
    (err) => {
      console.warn('Firestore engagement listener fallback:', err);
      notifySubscribers(key);
    }
  );

  firestoreUnsubscribers.set(key, unsub);
};

/**
 * Subscribes to the engagement counts (likes, views, total comments).
 * Synchronously emits the current state immediately so UI never hangs at 0.
 */
export const subscribeEngagement = (
  articleId: string | number,
  userId: string | null,
  callback: (state: EngagementState, isLikedByMe: boolean) => void
) => {
  if (articleId === '' || articleId === null || articleId === undefined) {
    return () => {};
  }

  const key = String(articleId);
  const record = getOrCreateRecord(key);

  let subSet = subscribers.get(key);
  if (!subSet) {
    subSet = new Set();
    subscribers.set(key, subSet);
  }

  const entry: SubscriberEntry = { userId, callback };
  subSet.add(entry);

  // 1. Emit current known state synchronously (never wait for network/Firestore)
  callback(
    {
      viewCount: record.viewCount,
      likeCount: record.likeCount,
      commentCount: record.commentCount,
    },
    userId ? record.likedBy.includes(userId) : false
  );

  // 2. Hydrate from backend API (shared batch request)
  void ensureBackendEngagementHydrated();

  // 3. Attach real-time Firestore listener (progressive enhancement)
  ensureFirestoreSubscription(key);

  return () => {
    const currentSet = subscribers.get(key);
    if (currentSet) {
      currentSet.delete(entry);
      if (currentSet.size === 0) {
        subscribers.delete(key);
        // Debounce Firestore unsubscribe by 1000ms so StrictMode / auth transitions don't drop listeners
        if (firestoreUnsubscribers.has(key) && !firestoreUnsubTimers.has(key)) {
          const timer = setTimeout(() => {
            firestoreUnsubTimers.delete(key);
            const activeSubs = subscribers.get(key);
            if (!activeSubs || activeSubs.size === 0) {
              const fsUnsub = firestoreUnsubscribers.get(key);
              if (fsUnsub) {
                fsUnsub();
                firestoreUnsubscribers.delete(key);
              }
            }
          }, FIRESTORE_UNSUB_DEBOUNCE_MS);
          firestoreUnsubTimers.set(key, timer);
        }
      }
    }
  };
};

const ensureFirestoreCommentSubscription = (key: string, limitCount: number) => {
  if (!db) return;

  const pendingTimer = firestoreCommentUnsubTimers.get(key);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    firestoreCommentUnsubTimers.delete(key);
  }

  if (firestoreCommentUnsubscribers.has(key)) return;

  const commentsRef = collection(db, 'articles', key, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const incoming: Comment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (typeof data.text !== 'string' || !data.text.trim()) return;
        const createdAt =
          typeof data.createdAt === 'number'
            ? data.createdAt
            : typeof data.createdAt?.toMillis === 'function'
              ? data.createdAt.toMillis()
              : Date.now();
        incoming.push({
          id: docSnap.id,
          userId: typeof data.userId === 'string' ? data.userId : 'guest',
          userName: typeof data.userName === 'string' ? data.userName : 'Pet Parent',
          text: data.text,
          createdAt,
          isGuest: typeof data.isGuest === 'boolean' ? data.isGuest : undefined,
        });
      });

      if (incoming.length > 0) {
        const existing = commentsStore.get(key) || getLocalStoredComments(key);
        const merged = mergeCommentsList(existing, incoming);
        commentsStore.set(key, merged);
        setLocalStoredComments(key, merged);
        notifyCommentSubscribers(key);
        mergeRecord(key, { commentCount: merged.length }, { source: 'local' });
      }
    },
    (err) => {
      // Progressive enhancement: never wipe locally cached / backend comments on Firestore error
      console.warn('Firestore comments listener fallback (non-fatal):', err);
      notifyCommentSubscribers(key);
    }
  );

  firestoreCommentUnsubscribers.set(key, unsub);
};

/**
 * Subscribes to article comments from local cache, backend API, and progressive Firestore updates.
 */
export const subscribeComments = (
  articleId: string | number,
  limitCount: number = 20,
  callback: (comments: Comment[]) => void
) => {
  if (articleId === '' || articleId === null || articleId === undefined) {
    callback([]);
    return () => {};
  }

  const key = String(articleId);

  let subSet = commentSubscribers.get(key);
  if (!subSet) {
    subSet = new Set();
    commentSubscribers.set(key, subSet);
  }
  subSet.add(callback);

  // 1. Emit cached comments immediately if available (or start hydrating from backend)
  const initialComments = commentsStore.get(key) || getLocalStoredComments(key);
  if (initialComments.length > 0) {
    commentsStore.set(key, initialComments);
    callback(initialComments.slice(0, limitCount));
  }

  // 2. Hydrate authoritative comments from backend API
  void apiRequest<{ comments?: Comment[]; commentCount?: number } | Comment[]>(
    `/articles/${encodeURIComponent(key)}/comments?limit=${encodeURIComponent(String(limitCount))}`,
    { timeoutMs: 8000 }
  )
    .then((res) => {
      const fetched = Array.isArray(res) ? res : Array.isArray(res?.comments) ? res.comments : [];
      const existing = commentsStore.get(key) || getLocalStoredComments(key);
      // Backend list is authoritative when non-empty; merge to preserve any just-posted local items
      const merged = fetched.length > 0 ? mergeCommentsList(existing, fetched) : existing;
      commentsStore.set(key, merged);
      setLocalStoredComments(key, merged);
      notifyCommentSubscribers(key);

      const remoteCount =
        !Array.isArray(res) && typeof res?.commentCount === 'number'
          ? res.commentCount
          : merged.length;
      mergeRecord(key, { commentCount: Math.max(remoteCount, merged.length) }, { source: 'local' });
    })
    .catch((err) => {
      console.warn('Backend comments fetch fallback:', err);
      // Ensure loading state resolves even when cache was empty and backend is unreachable
      notifyCommentSubscribers(key);
    });

  // 3. Attach Firestore real-time comments listener (progressive enhancement)
  ensureFirestoreCommentSubscription(key, limitCount);

  return () => {
    const currentSet = commentSubscribers.get(key);
    if (currentSet) {
      currentSet.delete(callback);
      if (currentSet.size === 0) {
        commentSubscribers.delete(key);
        if (firestoreCommentUnsubscribers.has(key) && !firestoreCommentUnsubTimers.has(key)) {
          const timer = setTimeout(() => {
            firestoreCommentUnsubTimers.delete(key);
            const activeSubs = commentSubscribers.get(key);
            if (!activeSubs || activeSubs.size === 0) {
              const fsUnsub = firestoreCommentUnsubscribers.get(key);
              if (fsUnsub) {
                fsUnsub();
                firestoreCommentUnsubscribers.delete(key);
              }
            }
          }, FIRESTORE_UNSUB_DEBOUNCE_MS);
          firestoreCommentUnsubTimers.set(key, timer);
        }
      }
    }
  };
};

/**
 * Native web share fallback.
 */
export const shareArticle = async (url: string, title: string, text: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Error sharing:', e);
      }
      return false;
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      return 'clipboard';
    } catch (e) {
      console.error('Clipboard copy failed', e);
      return false;
    }
  }
};
