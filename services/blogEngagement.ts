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
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { apiRequest } from './apiClient';
import { safeSessionStorage, safeStorage } from '../lib/storage';

/**
 * Returns baseline reader count for an article (0 for authentic, accurate counting).
 */
export const getBaselineReaders = (_articleId: string | number): number => {
  return 0;
};

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface EngagementState {
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

interface InternalEngagementRecord {
  viewCount: number;
  likeCount: number;
  likedBy: string[];
  commentCount: number;
}

type SubscriberEntry = {
  userId: string | null;
  callback: (state: EngagementState, isLikedByMe: boolean) => void;
};

// Shared in-memory store and Pub/Sub listeners so all cards & detail views stay in sync instantaneously
const engagementStore = new Map<string, InternalEngagementRecord>();
const subscribers = new Map<string, Set<SubscriberEntry>>();
const firestoreUnsubscribers = new Map<string, () => void>();

let initialBatchFetchPromise: Promise<void> | null = null;
let lastBatchFetchAt = 0;
const BATCH_FETCH_TTL_MS = 15_000;

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

const getOrCreateRecord = (key: string): InternalEngagementRecord => {
  const existing = engagementStore.get(key);
  const localViews = getLocalStoredViews(key);
  if (existing) {
    if (localViews > existing.viewCount) {
      existing.viewCount = localViews;
    }
    return existing;
  }

  const initial: InternalEngagementRecord = {
    viewCount: localViews,
    likeCount: 0,
    likedBy: [],
    commentCount: 0,
  };
  engagementStore.set(key, initial);
  return initial;
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

const mergeRecord = (
  key: string,
  incoming: Partial<InternalEngagementRecord>,
  options?: { authoritativeLikes?: boolean }
) => {
  const current = getOrCreateRecord(key);

  const nextViewCount = Math.max(
    current.viewCount,
    typeof incoming.viewCount === 'number' && incoming.viewCount >= 0 ? incoming.viewCount : 0,
    getLocalStoredViews(key)
  );

  const nextLikeCount = options?.authoritativeLikes
    ? typeof incoming.likeCount === 'number' && incoming.likeCount >= 0
      ? incoming.likeCount
      : current.likeCount
    : Math.max(
        current.likeCount,
        typeof incoming.likeCount === 'number' && incoming.likeCount >= 0 ? incoming.likeCount : 0
      );

  const nextLikedBy = Array.isArray(incoming.likedBy) ? incoming.likedBy : current.likedBy;

  const nextCommentCount = Math.max(
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
          mergeRecord(String(id), {
            viewCount: metrics.viewCount,
            likeCount: metrics.likeCount,
            likedBy: metrics.likedBy,
            commentCount: metrics.commentCount,
          });
        }
      }
    })
    .catch((err) => {
      console.warn('Backend engagement hydration fallback:', err);
    });

  return initialBatchFetchPromise;
};

// Helper to initialize article doc if it doesn't exist
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
          viewCount: current.viewCount || 0,
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
  try {
    const res = await apiRequest<{
      viewCount: number;
      likeCount: number;
      likedBy: string[];
      commentCount: number;
    }>(`/articles/${encodeURIComponent(key)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res) {
      backendSucceeded = true;
      mergeRecord(
        key,
        {
          viewCount: res.viewCount,
          likeCount: res.likeCount,
          likedBy: res.likedBy,
          commentCount: res.commentCount,
        },
        { authoritativeLikes: true }
      );
    }
  } catch (err) {
    console.warn('Backend toggleLike fallback:', err);
  }

  if (!db) return;
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

/**
 * Adds a new comment.
 */
export const addComment = async (
  articleId: string | number,
  userId: string,
  userName: string,
  text: string
) => {
  if (!db) return null;
  const key = String(articleId);
  const articleRef = doc(db, 'articles', key);
  const commentsRef = collection(articleRef, 'comments');

  await ensureArticleDoc(key);

  try {
    const docRef = await addDoc(commentsRef, {
      userId,
      userName,
      text,
      createdAt: serverTimestamp(),
    });

    await updateDoc(articleRef, {
      commentCount: increment(1),
    });

    const record = getOrCreateRecord(key);
    record.commentCount += 1;
    notifySubscribers(key);

    return docRef.id;
  } catch (e) {
    console.error('Error adding comment:', e);
    throw e;
  }
};

/**
 * Deletes a comment.
 */
export const deleteComment = async (articleId: string | number, commentId: string) => {
  if (!db) return;
  const key = String(articleId);
  const commentRef = doc(db, 'articles', key, 'comments', commentId);
  const articleRef = doc(db, 'articles', key);

  try {
    await deleteDoc(commentRef);
    await updateDoc(articleRef, {
      commentCount: increment(-1),
    });

    const record = getOrCreateRecord(key);
    record.commentCount = Math.max(0, record.commentCount - 1);
    notifySubscribers(key);
  } catch (e) {
    console.error('Error deleting comment:', e);
    throw e;
  }
};

/**
 * Increments the view count once per session and immediately updates all active UI subscribers,
 * backend persistence, and Cloud Firestore.
 */
export const incrementViews = async (articleId: string | number) => {
  if (articleId === '' || articleId === null || articleId === undefined) return;
  const key = String(articleId);
  const record = getOrCreateRecord(key);

  const viewedKey = `petbhai_v2_viewed_${key}`;
  const alreadyViewedInSession = safeSessionStorage.getItem(viewedKey) === 'true';

  if (alreadyViewedInSession && record.viewCount > 0) {
    notifySubscribers(key);
    return;
  }

  safeSessionStorage.setItem(viewedKey, 'true');

  // Optimistic increment so the reader sees the count increase immediately
  const nextCount = record.viewCount + 1;
  record.viewCount = nextCount;
  setLocalStoredViews(key, nextCount);
  notifySubscribers(key);

  // Persist to backend API (non-blocking reconciliation)
  apiRequest<{
    viewCount: number;
    likeCount: number;
    likedBy: string[];
    commentCount: number;
  }>(`/articles/${encodeURIComponent(key)}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientViewCount: nextCount }),
  })
    .then((res) => {
      if (res && typeof res.viewCount === 'number') {
        mergeRecord(key, {
          viewCount: res.viewCount,
          likeCount: res.likeCount,
          likedBy: res.likedBy,
          commentCount: res.commentCount,
        });
      }
    })
    .catch((err) => {
      console.warn('Backend view increment fallback:', err);
    });

  // Also persist directly to Cloud Firestore when available
  if (db) {
    const docRef = doc(db, 'articles', key);
    try {
      await setDoc(docRef, { viewCount: increment(1) }, { merge: true });
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
  if (!db || firestoreUnsubscribers.has(key)) return;

  const docRef = doc(db, 'articles', key);
  const unsub = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fsViews = typeof data.viewCount === 'number' ? data.viewCount : 0;
        const current = getOrCreateRecord(key);

        // If Firestore doc exists with 0 views while we already recorded a view locally, sync it up
        if (fsViews < current.viewCount && current.viewCount > 0) {
          setDoc(docRef, { viewCount: current.viewCount }, { merge: true }).catch(() => {});
        }

        mergeRecord(
          key,
          {
            viewCount: fsViews,
            likeCount: typeof data.likeCount === 'number' ? data.likeCount : 0,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
          },
          { authoritativeLikes: true }
        );
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
        const fsUnsub = firestoreUnsubscribers.get(key);
        if (fsUnsub) {
          fsUnsub();
          firestoreUnsubscribers.delete(key);
        }
      }
    }
  };
};

/**
 * Subscribes to the latest comments.
 */
export const subscribeComments = (
  articleId: string | number,
  limitCount: number = 20,
  callback: (comments: Comment[]) => void
) => {
  if (!db || articleId === '' || articleId === null || articleId === undefined) {
    callback([]);
    return () => {};
  }

  const commentsRef = collection(db, 'articles', String(articleId), 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        comments.push({
          id: docSnap.id,
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          createdAt: data.createdAt?.toMillis() || Date.now(),
        });
      });
      callback(comments);
    },
    (err) => {
      console.warn('Error subscribing to comments:', err);
      callback([]);
    }
  );
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
