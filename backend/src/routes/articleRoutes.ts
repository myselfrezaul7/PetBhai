import express from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { getBaselineReaders } from '../data/mockData';
import type { Article, ArticleComment } from '../types';
import { optionalAuth, type AuthRequest } from '../middleware/auth';
import {
  syncArticleEngagementToFirestore,
  fetchArticleEngagementFromFirestore,
  fetchAllArticleEngagementFromFirestore,
  syncArticleCommentToFirestore,
  deleteArticleCommentFromFirestore,
  fetchArticleCommentsFromFirestore,
} from '../services/firestoreSync';

export { getBaselineReaders };

const router = express.Router();

const FIRESTORE_SYNC_TIMEOUT_MS = 2500;

// In-memory rate limiter for article comment submissions: max 10 comments per 15 minutes per IP
const commentSubmissionTracker = new Map<string, { count: number; resetTime: number }>();
const COMMENT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_COMMENTS_PER_WINDOW = 10;

const rateLimitArticleComments = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const now = Date.now();
  const tracker = commentSubmissionTracker.get(ip);

  if (!tracker || now > tracker.resetTime) {
    commentSubmissionTracker.set(ip, { count: 1, resetTime: now + COMMENT_RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (tracker.count >= MAX_COMMENTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many comments submitted. Please wait a few minutes before posting again.',
      message: 'Too many comments submitted. Please wait a few minutes before posting again.',
    });
  }

  tracker.count += 1;
  return next();
};

const setNoCache = (res: express.Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

const findArticleByParam = (param: string): Article | undefined => {
  const numId = parseInt(param, 10);
  return db.articles.find((a) => (!Number.isNaN(numId) && a.id === numId) || a.slug === param);
};

const getEffectiveViews = (article: Article): number => {
  const baseline = getBaselineReaders(article.id);
  const current =
    typeof article.views === 'number' && Number.isFinite(article.views) ? article.views : 0;
  return Math.max(current, baseline);
};

const isAdminOrModerator = (user?: AuthRequest['user']): boolean => {
  if (!user) return false;
  return Boolean(
    user.isAdmin || ['super_admin', 'store_manager', 'moderator'].includes(user.role || '')
  );
};

const mergeCommentLists = (
  localComments: ArticleComment[],
  remoteComments: ArticleComment[]
): ArticleComment[] => {
  const byId = new Map<string, ArticleComment>();
  for (const item of remoteComments) {
    if (item && item.id) {
      byId.set(item.id, item);
    }
  }
  for (const item of localComments) {
    if (item && item.id) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

router.get('/', async (_req, res) => {
  const articlesWithBaseline = db.articles.map((article) => ({
    ...article,
    views: getEffectiveViews(article),
    likeCount:
      typeof article.likeCount === 'number' && article.likeCount >= 0 ? article.likeCount : 0,
    likedBy: Array.isArray(article.likedBy) ? article.likedBy : [],
    commentCount:
      typeof article.commentCount === 'number' && article.commentCount >= 0
        ? article.commentCount
        : (db.articleComments[String(article.id)] || []).length,
  }));
  res.json(articlesWithBaseline);
});

router.get('/engagement', async (_req, res) => {
  setNoCache(res);

  const remoteMap = await fetchAllArticleEngagementFromFirestore(FIRESTORE_SYNC_TIMEOUT_MS);

  const engagementMap: Record<
    string,
    { viewCount: number; likeCount: number; likedBy: string[]; commentCount: number }
  > = {};

  for (const article of db.articles) {
    const key = String(article.id);
    const remote = remoteMap[key];
    const baseline = getBaselineReaders(article.id);

    const localViews =
      typeof article.views === 'number' && Number.isFinite(article.views) ? article.views : 0;
    const remoteViews =
      typeof remote?.viewCount === 'number' && Number.isFinite(remote.viewCount)
        ? remote.viewCount
        : 0;
    const mergedViews = Math.max(localViews, remoteViews, baseline);
    if (mergedViews > localViews) {
      article.views = mergedViews;
    }

    const localLikedBy = Array.isArray(article.likedBy) ? article.likedBy : [];
    const mergedLikedBy =
      Array.isArray(remote?.likedBy) && remote.likedBy.length >= localLikedBy.length
        ? remote.likedBy
        : localLikedBy;
    const localLikeCount =
      typeof article.likeCount === 'number' && article.likeCount >= 0 ? article.likeCount : 0;
    const remoteLikeCount =
      typeof remote?.likeCount === 'number' && remote.likeCount >= 0 ? remote.likeCount : 0;
    const mergedLikeCount = Math.max(localLikeCount, remoteLikeCount, mergedLikedBy.length);

    const storedComments = db.articleComments[key] || [];
    const localCommentCount =
      typeof article.commentCount === 'number' && article.commentCount >= 0
        ? article.commentCount
        : 0;
    const remoteCommentCount =
      typeof remote?.commentCount === 'number' && remote.commentCount >= 0
        ? remote.commentCount
        : 0;
    const mergedCommentCount = Math.max(
      localCommentCount,
      remoteCommentCount,
      storedComments.length
    );

    engagementMap[key] = {
      viewCount: mergedViews,
      likeCount: mergedLikeCount,
      likedBy: mergedLikedBy,
      commentCount: mergedCommentCount,
    };
  }

  res.json(engagementMap);
});

router.post('/:id/view', async (req, res) => {
  setNoCache(res);
  const article = findArticleByParam(req.params.id);

  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }

  const remote = await fetchArticleEngagementFromFirestore(article.id, 1500);
  const baseline = getBaselineReaders(article.id);

  const clientCount =
    typeof req.body?.clientViewCount === 'number' &&
    Number.isFinite(req.body.clientViewCount) &&
    req.body.clientViewCount > 0
      ? Math.floor(req.body.clientViewCount)
      : 0;

  const localViews =
    typeof article.views === 'number' && Number.isFinite(article.views) ? article.views : 0;
  const remoteViews =
    typeof remote?.viewCount === 'number' && Number.isFinite(remote.viewCount)
      ? remote.viewCount
      : 0;

  const baseCurrent = Math.max(localViews, remoteViews, baseline);
  article.views = Math.max(baseCurrent + 1, clientCount);

  const likedBy = Array.isArray(article.likedBy)
    ? article.likedBy
    : Array.isArray(remote?.likedBy)
      ? remote.likedBy
      : [];
  const likeCount = Math.max(
    typeof article.likeCount === 'number' ? article.likeCount : 0,
    typeof remote?.likeCount === 'number' ? remote.likeCount : 0,
    likedBy.length
  );
  const commentCount = Math.max(
    typeof article.commentCount === 'number' ? article.commentCount : 0,
    typeof remote?.commentCount === 'number' ? remote.commentCount : 0,
    (db.articleComments[String(article.id)] || []).length
  );

  article.likedBy = likedBy;
  article.likeCount = likeCount;
  article.commentCount = commentCount;

  try {
    await db.write();
  } catch (err) {
    console.warn('Non-fatal db.write error on article view increment:', err);
  }

  const firestoreSynced = await syncArticleEngagementToFirestore(
    article.id,
    {
      viewCount: article.views,
      likeCount: article.likeCount,
      likedBy: article.likedBy,
      commentCount: article.commentCount,
    },
    FIRESTORE_SYNC_TIMEOUT_MS
  );

  return res.json({
    id: article.id,
    viewCount: article.views,
    likeCount: article.likeCount,
    likedBy: article.likedBy,
    commentCount: article.commentCount,
    firestoreSynced,
  });
});

router.post('/:id/like', async (req, res) => {
  setNoCache(res);
  const article = findArticleByParam(req.params.id);

  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }

  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const remote = await fetchArticleEngagementFromFirestore(article.id, 1500);
  const baseline = getBaselineReaders(article.id);
  const baseLikedBy =
    Array.isArray(article.likedBy) && article.likedBy.length > 0
      ? article.likedBy
      : Array.isArray(remote?.likedBy)
        ? remote.likedBy
        : [];

  const likedBy = new Set<string>(baseLikedBy);
  if (likedBy.has(userId)) {
    likedBy.delete(userId);
  } else {
    likedBy.add(userId);
  }

  article.likedBy = Array.from(likedBy);
  article.likeCount = article.likedBy.length;
  article.views = Math.max(
    typeof article.views === 'number' ? article.views : 0,
    typeof remote?.viewCount === 'number' ? remote.viewCount : 0,
    baseline
  );
  article.commentCount = Math.max(
    typeof article.commentCount === 'number' ? article.commentCount : 0,
    typeof remote?.commentCount === 'number' ? remote.commentCount : 0,
    (db.articleComments[String(article.id)] || []).length
  );

  try {
    await db.write();
  } catch (err) {
    console.warn('Non-fatal db.write error on article like toggle:', err);
  }

  const firestoreSynced = await syncArticleEngagementToFirestore(
    article.id,
    {
      viewCount: article.views,
      likeCount: article.likeCount,
      likedBy: article.likedBy,
      commentCount: article.commentCount,
    },
    FIRESTORE_SYNC_TIMEOUT_MS
  );

  return res.json({
    id: article.id,
    viewCount: article.views,
    likeCount: article.likeCount,
    likedBy: article.likedBy,
    commentCount: article.commentCount,
    isLiked: likedBy.has(userId),
    firestoreSynced,
  });
});

// GET /api/articles/:id/comments - Fetch comments/questions for an article
router.get('/:id/comments', async (req, res) => {
  setNoCache(res);
  const article = findArticleByParam(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found', message: 'Article not found' });
  }

  const key = String(article.id);
  const requestedLimit = parseInt(String(req.query.limit || '50'), 10);
  const limitCount = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;

  const localComments = Array.isArray(db.articleComments[key]) ? db.articleComments[key] : [];
  const remoteComments = await fetchArticleCommentsFromFirestore(
    article.id,
    FIRESTORE_SYNC_TIMEOUT_MS
  );
  const merged = mergeCommentLists(localComments, remoteComments);

  if (merged.length > localComments.length) {
    db.articleComments[key] = merged;
  }

  const commentCount = Math.max(
    typeof article.commentCount === 'number' && article.commentCount >= 0
      ? article.commentCount
      : 0,
    merged.length
  );
  article.commentCount = commentCount;

  return res.json({
    comments: merged.slice(0, limitCount),
    commentCount,
  });
});

// POST /api/articles/:id/comments - Add a comment/question (supports authenticated users & guest visitors)
router.post(
  '/:id/comments',
  rateLimitArticleComments,
  optionalAuth,
  async (req: AuthRequest, res) => {
    setNoCache(res);
    const article = findArticleByParam(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found', message: 'Article not found' });
    }

    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (rawText.length < 2) {
      return res.status(400).json({
        error: 'Comment must be at least 2 characters long.',
        message: 'Comment must be at least 2 characters long.',
      });
    }
    if (rawText.length > 1500) {
      return res.status(400).json({
        error: 'Comment cannot exceed 1500 characters.',
        message: 'Comment cannot exceed 1500 characters.',
      });
    }

    const key = String(article.id);
    let userId: string;
    let userName: string;
    let isGuest = false;

    if (req.user) {
      userId = String(req.user.id);
      const providedName =
        typeof req.body?.userName === 'string' && req.body.userName.trim()
          ? req.body.userName.trim().slice(0, 80)
          : '';
      userName = providedName || req.user.name || 'PetBhai Member';
      isGuest = false;
    } else {
      isGuest = true;
      const rawGuestName =
        typeof req.body?.userName === 'string' && req.body.userName.trim()
          ? req.body.userName.trim()
          : typeof req.body?.guestName === 'string' && req.body.guestName.trim()
            ? req.body.guestName.trim()
            : '';
      userName = rawGuestName ? rawGuestName.slice(0, 80) : 'Pet Parent';

      const providedGuestId =
        typeof req.body?.userId === 'string' && req.body.userId.trim().startsWith('guest_')
          ? req.body.userId.trim().slice(0, 80)
          : '';
      userId = providedGuestId || `guest_${crypto.randomBytes(6).toString('hex')}`;
    }

    const newComment: ArticleComment = {
      id: `cmt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      userName,
      text: rawText,
      createdAt: Date.now(),
      isGuest,
    };

    if (!Array.isArray(db.articleComments[key])) {
      db.articleComments[key] = [];
    }
    db.articleComments[key].unshift(newComment);

    const currentCount =
      typeof article.commentCount === 'number' && article.commentCount >= 0
        ? article.commentCount
        : 0;
    article.commentCount = Math.max(currentCount + 1, db.articleComments[key].length);
    article.views = getEffectiveViews(article);

    try {
      await db.write();
    } catch (err) {
      console.warn('Non-fatal db.write error on article comment creation:', err);
    }

    await Promise.all([
      syncArticleCommentToFirestore(article.id, newComment, FIRESTORE_SYNC_TIMEOUT_MS),
      syncArticleEngagementToFirestore(
        article.id,
        {
          viewCount: article.views,
          likeCount: article.likeCount || 0,
          likedBy: article.likedBy || [],
          commentCount: article.commentCount,
        },
        FIRESTORE_SYNC_TIMEOUT_MS
      ),
    ]);

    return res.status(201).json({
      success: true,
      comment: newComment,
      commentCount: article.commentCount,
    });
  }
);

// DELETE /api/articles/:id/comments/:commentId - Delete an article comment
router.delete('/:id/comments/:commentId', optionalAuth, async (req: AuthRequest, res) => {
  setNoCache(res);
  const article = findArticleByParam(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found', message: 'Article not found' });
  }

  const commentId = typeof req.params.commentId === 'string' ? req.params.commentId.trim() : '';
  if (!commentId) {
    return res.status(400).json({ error: 'Invalid comment ID', message: 'Invalid comment ID' });
  }

  const key = String(article.id);
  if (!Array.isArray(db.articleComments[key])) {
    db.articleComments[key] = [];
  }

  let localIndex = db.articleComments[key].findIndex((c) => c.id === commentId);
  let targetComment: ArticleComment | undefined =
    localIndex !== -1 ? db.articleComments[key][localIndex] : undefined;

  if (!targetComment) {
    const remoteComments = await fetchArticleCommentsFromFirestore(article.id, 1500);
    targetComment = remoteComments.find((c) => c.id === commentId);
  }

  if (!targetComment) {
    return res.status(404).json({ error: 'Comment not found', message: 'Comment not found' });
  }

  const requesterGuestId =
    (typeof req.query.userId === 'string' && req.query.userId.trim()) ||
    (typeof req.body?.userId === 'string' && req.body.userId.trim()) ||
    '';

  const canDelete =
    isAdminOrModerator(req.user) ||
    (Boolean(req.user) && String(req.user!.id) === String(targetComment.userId)) ||
    (Boolean(requesterGuestId) &&
      targetComment.userId.startsWith('guest_') &&
      targetComment.userId === requesterGuestId);

  if (!canDelete) {
    if (!req.user && !requesterGuestId) {
      return res
        .status(401)
        .json({ error: 'Authentication required', message: 'Authentication required' });
    }
    return res.status(403).json({
      error: 'You can only delete your own comments.',
      message: 'You can only delete your own comments.',
    });
  }

  if (localIndex !== -1) {
    db.articleComments[key].splice(localIndex, 1);
  }

  const currentCount =
    typeof article.commentCount === 'number' && article.commentCount >= 0
      ? article.commentCount
      : db.articleComments[key].length + 1;
  article.commentCount = Math.max(0, currentCount - 1, db.articleComments[key].length);
  article.views = getEffectiveViews(article);

  try {
    await db.write();
  } catch (err) {
    console.warn('Non-fatal db.write error on article comment deletion:', err);
  }

  await Promise.all([
    deleteArticleCommentFromFirestore(article.id, commentId, FIRESTORE_SYNC_TIMEOUT_MS),
    syncArticleEngagementToFirestore(
      article.id,
      {
        viewCount: article.views,
        likeCount: article.likeCount || 0,
        likedBy: article.likedBy || [],
        commentCount: article.commentCount,
      },
      FIRESTORE_SYNC_TIMEOUT_MS
    ),
  ]);

  return res.json({
    success: true,
    commentId,
    commentCount: article.commentCount,
  });
});

router.get('/:id', async (req, res) => {
  const article = findArticleByParam(req.params.id);
  if (article) {
    res.json({
      ...article,
      views: getEffectiveViews(article),
      likeCount:
        typeof article.likeCount === 'number' && article.likeCount >= 0 ? article.likeCount : 0,
      likedBy: Array.isArray(article.likedBy) ? article.likedBy : [],
      commentCount:
        typeof article.commentCount === 'number' && article.commentCount >= 0
          ? article.commentCount
          : (db.articleComments[String(article.id)] || []).length,
    });
  } else {
    res.status(404).json({ message: 'Article not found' });
  }
});

export default router;
