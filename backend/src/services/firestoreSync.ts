import { getFirebaseAdmin } from '../routes/authHelpers';
import type { ArticleComment, Question } from '../types';

export interface ArticleEngagementMetrics {
  viewCount?: number;
  likeCount?: number;
  likedBy?: string[];
  commentCount?: number;
}

const DEFAULT_FIRESTORE_TIMEOUT_MS = 2500;
const FIRESTORE_ADMIN_APP_NAME = 'petbhai-firestore-sync';

let cachedAdminFirestore: FirebaseFirestore.Firestore | null = null;
let adminInitAttempted = false;
let adminCredentialsUnavailable = false;

const isTestEnvironment = (): boolean =>
  process.env.NODE_ENV === 'test' && process.env.ENABLE_FIRESTORE_IN_TEST !== 'true';

const getProjectId = (): string =>
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'petbhai-d087c';

const getFirebaseApiKey = (): string =>
  process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';

const getFirestoreRestBaseUrl = (): string =>
  `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    getProjectId()
  )}/databases/(default)/documents`;

const cleanUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = cleanUndefined(value);
    }
  }
  return result;
};

const parseServiceAccountKey = (): Record<string, any> | null => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  const tryParse = (candidate: string): Record<string, any> | null => {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      }
    } catch {
      // try next format
    }
    return null;
  };

  const direct = tryParse(raw);
  if (direct) return direct;

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return tryParse(decoded);
  } catch {
    return null;
  }
};

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS,
  fallbackValue: T
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } catch {
    return fallbackValue;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const isCredentialError = (error: unknown): boolean => {
  const msg = String((error as any)?.message || error || '').toLowerCase();
  return (
    msg.includes('could not load the default credentials') ||
    msg.includes('default credentials') ||
    msg.includes('unauthenticated') ||
    msg.includes('unable to detect a project id') ||
    msg.includes('metadata')
  );
};

/**
 * Returns an initialized Firebase Admin Firestore instance when explicit credentials
 * (`FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`) are available.
 * Returns null when credentials are absent so callers can seamlessly use the REST API fallback.
 */
const getAdminFirestore = async (): Promise<FirebaseFirestore.Firestore | null> => {
  if (isTestEnvironment() || adminCredentialsUnavailable) return null;
  if (cachedAdminFirestore) return cachedAdminFirestore;

  const serviceAccount = parseServiceAccountKey();
  const hasGoogleAdc = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());

  if (!serviceAccount && !hasGoogleAdc) {
    adminCredentialsUnavailable = true;
    return null;
  }

  if (adminInitAttempted && !cachedAdminFirestore) {
    return null;
  }
  adminInitAttempted = true;

  try {
    const adminModule = await import('firebase-admin');
    const admin = (adminModule as any).default || adminModule;

    if (serviceAccount) {
      let app = admin.apps?.find((a: any) => a && a.name === FIRESTORE_ADMIN_APP_NAME);
      if (!app) {
        app = admin.initializeApp(
          {
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || getProjectId(),
          },
          FIRESTORE_ADMIN_APP_NAME
        );
      }
      cachedAdminFirestore = admin.firestore(app);
      return cachedAdminFirestore;
    }

    const adminApp = await getFirebaseAdmin();
    if (!adminApp) {
      adminCredentialsUnavailable = true;
      return null;
    }
    cachedAdminFirestore = admin.firestore(adminApp);
    return cachedAdminFirestore;
  } catch (error) {
    console.warn('Firebase Admin Firestore init failed, using REST fallback:', error);
    adminCredentialsUnavailable = true;
    return null;
  }
};

// ---------------- Firestore REST API v1 helpers ----------------

const toFirestoreValue = (value: any): Record<string, any> => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.filter((item) => item !== undefined).map(toFirestoreValue),
      },
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value),
      },
    };
  }
  return { stringValue: String(value) };
};

const toFirestoreFields = (obj: Record<string, any>): Record<string, any> => {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
};

const fromFirestoreValue = (fv: any): any => {
  if (!fv || typeof fv !== 'object') return undefined;
  if ('stringValue' in fv) return fv.stringValue;
  if ('integerValue' in fv) return Number(fv.integerValue);
  if ('doubleValue' in fv) return Number(fv.doubleValue);
  if ('booleanValue' in fv) return Boolean(fv.booleanValue);
  if ('timestampValue' in fv) return fv.timestampValue;
  if ('nullValue' in fv) return null;
  if ('arrayValue' in fv) {
    const values = Array.isArray(fv.arrayValue?.values) ? fv.arrayValue.values : [];
    return values.map(fromFirestoreValue);
  }
  if ('mapValue' in fv) {
    return fromFirestoreFields(fv.mapValue?.fields || {});
  }
  return undefined;
};

const fromFirestoreFields = (fields: Record<string, any> = {}): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(value);
  }
  return result;
};

const extractDocIdFromName = (name?: string): string => {
  if (!name) return '';
  const parts = name.split('/');
  return parts[parts.length - 1] || '';
};

const restFetch = async (
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<Response | null> => {
  if (isTestEnvironment() || typeof fetch !== 'function') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const apiKey = getFirebaseApiKey();
    const finalUrl = apiKey
      ? `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`
      : url;

    return await fetch(finalUrl, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    console.warn('Firestore REST request failed (non-fatal):', (err as Error)?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const restPatchDocument = async (
  docPath: string,
  data: Record<string, any>,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  const cleaned = cleanUndefined(data);
  const fieldNames = Object.keys(cleaned);
  if (fieldNames.length === 0) return false;

  const maskParams = fieldNames
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&');
  const url = `${getFirestoreRestBaseUrl()}/${docPath}?${maskParams}`;

  const res = await restFetch(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(cleaned) }),
    },
    timeoutMs
  );

  return Boolean(res && res.ok);
};

const restGetDocument = async (
  docPath: string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<Record<string, any> | null> => {
  const url = `${getFirestoreRestBaseUrl()}/${docPath}`;
  const res = await restFetch(url, { method: 'GET' }, timeoutMs);
  if (!res || !res.ok) return null;

  const json = (await res.json().catch(() => null)) as { fields?: Record<string, any> } | null;
  if (!json || !json.fields) return null;
  return fromFirestoreFields(json.fields);
};

const restListCollection = async (
  collectionPath: string,
  pageSize: number = 200,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<Array<{ id: string; data: Record<string, any> }>> => {
  const url = `${getFirestoreRestBaseUrl()}/${collectionPath}?pageSize=${pageSize}`;
  const res = await restFetch(url, { method: 'GET' }, timeoutMs);
  if (!res || !res.ok) return [];

  const json = (await res.json().catch(() => null)) as {
    documents?: Array<{ name?: string; fields?: Record<string, any> }>;
  } | null;
  if (!json || !Array.isArray(json.documents)) return [];

  return json.documents
    .map((doc) => ({
      id: extractDocIdFromName(doc.name),
      data: fromFirestoreFields(doc.fields || {}),
    }))
    .filter((entry) => entry.id.length > 0);
};

const restDeleteDocument = async (
  docPath: string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  const url = `${getFirestoreRestBaseUrl()}/${docPath}`;
  const res = await restFetch(url, { method: 'DELETE' }, timeoutMs);
  return Boolean(res && (res.ok || res.status === 404));
};

// ---------------- Existing Admin Sync Functions ----------------

/**
 * Synchronizes an order to Cloud Firestore 'orders' collection
 * and triggers an update event in 'system/admin_live_feed'.
 * Gracefully handles cases where Firebase Admin is unconfigured.
 */
export const syncOrderToFirestore = async (order: any): Promise<void> => {
  if (!order || !order.orderId) return;

  try {
    const firestore = await getAdminFirestore();
    if (!firestore) return;

    const docId = String(order.orderId);
    await firestore.collection('orders').doc(docId).set(cleanUndefined(order), { merge: true });

    await firestore
      .collection('system')
      .doc('admin_live_feed')
      .set(
        cleanUndefined({
          lastEvent: 'order-updated',
          orderId: order.orderId,
          status: order.status,
          timestamp: new Date().toISOString(),
        }),
        { merge: true }
      );
  } catch (error) {
    if (isCredentialError(error)) adminCredentialsUnavailable = true;
    console.warn('Firestore syncOrder failed (non-fatal):', error);
  }
};

/**
 * Synchronizes product stock updates to Cloud Firestore 'inventory' collection
 * and triggers an update event in 'system/admin_live_feed'.
 */
export const syncInventoryToFirestore = async (
  productId: number,
  stockQuantity: number = 0,
  stockStatus: string = 'in-stock'
): Promise<void> => {
  try {
    const firestore = await getAdminFirestore();
    if (!firestore) return;

    await firestore
      .collection('inventory')
      .doc(String(productId))
      .set(
        cleanUndefined({
          productId,
          stockQuantity,
          stockStatus,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );

    await firestore
      .collection('system')
      .doc('admin_live_feed')
      .set(
        cleanUndefined({
          lastEvent: 'inventory-updated',
          productId,
          stockQuantity,
          stockStatus,
          timestamp: new Date().toISOString(),
        }),
        { merge: true }
      );
  } catch (error) {
    if (isCredentialError(error)) adminCredentialsUnavailable = true;
    console.warn('Firestore syncInventory failed (non-fatal):', error);
  }
};

/**
 * Synchronizes a user notification to Cloud Firestore under users/{userId}/notifications/{notifId}.
 */
export const syncNotificationToFirestore = async (
  userId: number | string,
  notification: any
): Promise<void> => {
  if (!userId || !notification) return;

  try {
    const firestore = await getAdminFirestore();
    if (!firestore) return;

    const notifId = notification.id
      ? String(notification.id)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await firestore
      .collection('users')
      .doc(String(userId))
      .collection('notifications')
      .doc(notifId)
      .set(
        cleanUndefined({
          ...notification,
          id: notifId,
          timestamp: new Date().toISOString(),
        }),
        { merge: true }
      );
  } catch (error) {
    if (isCredentialError(error)) adminCredentialsUnavailable = true;
    console.warn('Firestore syncNotification failed (non-fatal):', error);
  }
};

/**
 * Synchronizes arbitrary admin events to 'system/admin_live_feed' in Firestore.
 */
export const syncAdminFeedToFirestore = async (
  eventType: string,
  payload: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const firestore = await getAdminFirestore();
    if (!firestore) return;

    await firestore
      .collection('system')
      .doc('admin_live_feed')
      .set(
        cleanUndefined({
          lastEvent: eventType,
          ...payload,
          timestamp: new Date().toISOString(),
        }),
        { merge: true }
      );
  } catch (error) {
    if (isCredentialError(error)) adminCredentialsUnavailable = true;
    console.warn('Firestore syncAdminFeed failed (non-fatal):', error);
  }
};

// ---------------- Article Engagement Sync (Admin SDK + REST Fallback) ----------------

const normalizeEngagementDoc = (
  data: Record<string, any> | null
): ArticleEngagementMetrics | null => {
  if (!data || typeof data !== 'object') return null;
  return {
    viewCount:
      typeof data.viewCount === 'number' && Number.isFinite(data.viewCount)
        ? data.viewCount
        : undefined,
    likeCount:
      typeof data.likeCount === 'number' && Number.isFinite(data.likeCount)
        ? data.likeCount
        : undefined,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy.map((item) => String(item)) : undefined,
    commentCount:
      typeof data.commentCount === 'number' && Number.isFinite(data.commentCount)
        ? data.commentCount
        : undefined,
  };
};

/**
 * Synchronizes article engagement metrics (viewCount, likeCount, likedBy, commentCount)
 * to Cloud Firestore 'articles/{articleId}' with Admin SDK + REST API fallback and timeout.
 */
export const syncArticleEngagementToFirestore = async (
  articleId: number | string,
  engagement: ArticleEngagementMetrics,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  if (isTestEnvironment()) return false;
  const docId = String(articleId);
  const payload = cleanUndefined({
    ...engagement,
    updatedAt: new Date().toISOString(),
  });

  const task = async (): Promise<boolean> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        await firestore.collection('articles').doc(docId).set(payload, { merge: true });
        return true;
      } catch (error) {
        if (isCredentialError(error)) {
          adminCredentialsUnavailable = true;
        }
        console.warn('Firestore Admin syncArticleEngagement failed, trying REST fallback:', error);
      }
    }

    return restPatchDocument(`articles/${encodeURIComponent(docId)}`, payload, timeoutMs);
  };

  return withTimeout(task(), timeoutMs, false);
};

/**
 * Reads a single article's engagement doc from Firestore (Admin SDK + REST fallback).
 */
export const fetchArticleEngagementFromFirestore = async (
  articleId: number | string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<ArticleEngagementMetrics | null> => {
  if (isTestEnvironment()) return null;
  const docId = String(articleId);

  const task = async (): Promise<ArticleEngagementMetrics | null> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        const snap = await firestore.collection('articles').doc(docId).get();
        if (snap.exists) {
          return normalizeEngagementDoc(snap.data() || null);
        }
        return null;
      } catch (error) {
        if (isCredentialError(error)) {
          adminCredentialsUnavailable = true;
        }
        console.warn('Firestore Admin fetchArticleEngagement failed, trying REST fallback:', error);
      }
    }

    const data = await restGetDocument(`articles/${encodeURIComponent(docId)}`, timeoutMs);
    return normalizeEngagementDoc(data);
  };

  return withTimeout(task(), timeoutMs, null);
};

/**
 * Fetches engagement docs for all articles from Firestore (Admin SDK + REST fallback).
 */
export const fetchAllArticleEngagementFromFirestore = async (
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<Record<string, ArticleEngagementMetrics>> => {
  if (isTestEnvironment()) return {};

  const task = async (): Promise<Record<string, ArticleEngagementMetrics>> => {
    const result: Record<string, ArticleEngagementMetrics> = {};
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('articles').get();
        snapshot.forEach((docSnap) => {
          const normalized = normalizeEngagementDoc(docSnap.data());
          if (normalized) {
            result[docSnap.id] = normalized;
          }
        });
        return result;
      } catch (error) {
        if (isCredentialError(error)) {
          adminCredentialsUnavailable = true;
        }
        console.warn(
          'Firestore Admin fetchAllArticleEngagement failed, trying REST fallback:',
          error
        );
      }
    }

    const docs = await restListCollection('articles', 200, timeoutMs);
    for (const entry of docs) {
      const normalized = normalizeEngagementDoc(entry.data);
      if (normalized) {
        result[entry.id] = normalized;
      }
    }
    return result;
  };

  return withTimeout(task(), timeoutMs, {});
};

// ---------------- Article Comments Sync (Admin SDK + REST Fallback) ----------------

const normalizeCommentDoc = (id: string, data: Record<string, any>): ArticleComment | null => {
  if (!data || typeof data.text !== 'string' || !data.text.trim()) return null;
  let createdAt = Date.now();
  if (typeof data.createdAt === 'number' && Number.isFinite(data.createdAt)) {
    createdAt = data.createdAt;
  } else if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
    createdAt = data.createdAt.toMillis();
  } else if (typeof data.createdAt === 'string') {
    const parsed = Date.parse(data.createdAt);
    if (!Number.isNaN(parsed)) createdAt = parsed;
  }

  return {
    id,
    userId: typeof data.userId === 'string' && data.userId ? data.userId : 'guest',
    userName: typeof data.userName === 'string' && data.userName ? data.userName : 'Pet Parent',
    text: data.text,
    createdAt,
    isGuest: typeof data.isGuest === 'boolean' ? data.isGuest : undefined,
  };
};

export const syncArticleCommentToFirestore = async (
  articleId: number | string,
  comment: ArticleComment,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  if (isTestEnvironment() || !comment?.id) return false;
  const key = String(articleId);
  const payload = cleanUndefined({
    userId: comment.userId,
    userName: comment.userName,
    text: comment.text,
    createdAt: comment.createdAt,
    isGuest: comment.isGuest,
  });

  const task = async (): Promise<boolean> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        await firestore
          .collection('articles')
          .doc(key)
          .collection('comments')
          .doc(comment.id)
          .set(payload, { merge: true });
        return true;
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin syncArticleComment failed, trying REST fallback:', error);
      }
    }

    return restPatchDocument(
      `articles/${encodeURIComponent(key)}/comments/${encodeURIComponent(comment.id)}`,
      payload,
      timeoutMs
    );
  };

  return withTimeout(task(), timeoutMs, false);
};

export const deleteArticleCommentFromFirestore = async (
  articleId: number | string,
  commentId: string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  if (isTestEnvironment() || !commentId) return false;
  const key = String(articleId);

  const task = async (): Promise<boolean> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        await firestore
          .collection('articles')
          .doc(key)
          .collection('comments')
          .doc(commentId)
          .delete();
        return true;
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin deleteArticleComment failed, trying REST fallback:', error);
      }
    }

    return restDeleteDocument(
      `articles/${encodeURIComponent(key)}/comments/${encodeURIComponent(commentId)}`,
      timeoutMs
    );
  };

  return withTimeout(task(), timeoutMs, false);
};

export const fetchArticleCommentsFromFirestore = async (
  articleId: number | string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<ArticleComment[]> => {
  if (isTestEnvironment()) return [];
  const key = String(articleId);

  const task = async (): Promise<ArticleComment[]> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore
          .collection('articles')
          .doc(key)
          .collection('comments')
          .get();
        const items: ArticleComment[] = [];
        snapshot.forEach((docSnap) => {
          const normalized = normalizeCommentDoc(docSnap.id, docSnap.data());
          if (normalized) items.push(normalized);
        });
        return items.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin fetchArticleComments failed, trying REST fallback:', error);
      }
    }

    const docs = await restListCollection(
      `articles/${encodeURIComponent(key)}/comments`,
      100,
      timeoutMs
    );
    return docs
      .map((entry) => normalizeCommentDoc(entry.id, entry.data))
      .filter((item): item is ArticleComment => item !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  return withTimeout(task(), timeoutMs, []);
};

// ---------------- Visitor Questions Sync (Admin SDK + REST Fallback) ----------------

const sanitizePublicQuestionForFirestore = (
  question: Question,
  options?: { clearUnpublishedAnswer?: boolean }
): Record<string, any> => {
  // Never store private visitor email or unpublished draft answers in public /questions/{questionId} Firestore docs
  const { email: _privateEmail, answer, answeredBy, answeredAt, ...basePublicFields } = question;

  if (question.status === 'answered') {
    return cleanUndefined({
      ...basePublicFields,
      answer,
      answeredBy,
      answeredAt,
      updatedAt: new Date().toISOString(),
    });
  }

  return cleanUndefined({
    ...basePublicFields,
    ...(options?.clearUnpublishedAnswer
      ? { answer: null, answeredBy: null, answeredAt: null }
      : {}),
    updatedAt: new Date().toISOString(),
  });
};

const normalizeQuestionDoc = (id: string, data: Record<string, any>): Question | null => {
  if (!data || typeof data.question !== 'string' || !data.question.trim()) return null;
  const numericId = Number(data.id ?? id);
  if (!Number.isFinite(numericId)) return null;

  return {
    id: numericId,
    name: typeof data.name === 'string' && data.name ? data.name : 'Pet Parent',
    topic: typeof data.topic === 'string' && data.topic ? data.topic : 'General',
    question: data.question,
    createdAt:
      typeof data.createdAt === 'string' && data.createdAt
        ? data.createdAt
        : new Date().toISOString(),
    status:
      data.status === 'answered' || data.status === 'rejected' || data.status === 'pending'
        ? data.status
        : 'pending',
    answer: typeof data.answer === 'string' ? data.answer : undefined,
    answeredBy: typeof data.answeredBy === 'string' ? data.answeredBy : undefined,
    answeredAt: typeof data.answeredAt === 'string' ? data.answeredAt : undefined,
    answeredBlogSlug: typeof data.answeredBlogSlug === 'string' ? data.answeredBlogSlug : undefined,
    answeredBlogTitle:
      typeof data.answeredBlogTitle === 'string' ? data.answeredBlogTitle : undefined,
    helpfulCount:
      typeof data.helpfulCount === 'number' && Number.isFinite(data.helpfulCount)
        ? data.helpfulCount
        : 0,
  };
};

/**
 * Synchronizes a visitor Q&A question to Cloud Firestore 'questions/{questionId}'
 * (stripping private email) with Admin SDK + REST API fallback and timeout.
 */
export const syncQuestionToFirestore = async (
  question: Question,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS,
  options?: { clearUnpublishedAnswer?: boolean }
): Promise<boolean> => {
  if (isTestEnvironment() || !question || !question.id) return false;
  const docId = String(question.id);
  const payload = sanitizePublicQuestionForFirestore(question, options);

  const task = async (): Promise<boolean> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        await firestore.collection('questions').doc(docId).set(payload, { merge: true });
        await firestore
          .collection('system')
          .doc('admin_live_feed')
          .set(
            cleanUndefined({
              lastEvent: 'question-updated',
              questionId: question.id,
              topic: question.topic,
              status: question.status || 'pending',
              timestamp: new Date().toISOString(),
            }),
            { merge: true }
          )
          .catch(() => {});
        return true;
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin syncQuestion failed, trying REST fallback:', error);
      }
    }

    return restPatchDocument(`questions/${encodeURIComponent(docId)}`, payload, timeoutMs);
  };

  return withTimeout(task(), timeoutMs, false);
};

export const deleteQuestionFromFirestore = async (
  questionId: number | string,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<boolean> => {
  if (isTestEnvironment() || !questionId) return false;
  const docId = String(questionId);

  const task = async (): Promise<boolean> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        await firestore.collection('questions').doc(docId).delete();
        return true;
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin deleteQuestion failed, trying REST fallback:', error);
      }
    }

    return restDeleteDocument(`questions/${encodeURIComponent(docId)}`, timeoutMs);
  };

  return withTimeout(task(), timeoutMs, false);
};

export const fetchQuestionsFromFirestore = async (
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS
): Promise<Question[]> => {
  if (isTestEnvironment()) return [];

  const task = async (): Promise<Question[]> => {
    const firestore = await getAdminFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('questions').get();
        const items: Question[] = [];
        snapshot.forEach((docSnap) => {
          const normalized = normalizeQuestionDoc(docSnap.id, docSnap.data());
          if (normalized) items.push(normalized);
        });
        return items;
      } catch (error) {
        if (isCredentialError(error)) adminCredentialsUnavailable = true;
        console.warn('Firestore Admin fetchQuestions failed, trying REST fallback:', error);
      }
    }

    const docs = await restListCollection('questions', 200, timeoutMs);
    return docs
      .map((entry) => normalizeQuestionDoc(entry.id, entry.data))
      .filter((item): item is Question => item !== null);
  };

  return withTimeout(task(), timeoutMs, []);
};
