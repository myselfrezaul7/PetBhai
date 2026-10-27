import express from 'express';
import { db } from '../db';
import { syncArticleEngagementToFirestore } from '../services/firestoreSync';

const router = express.Router();

const setNoCache = (res: express.Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

router.get('/', async (req, res) => {
  res.json(db.articles);
});

router.get('/engagement', async (req, res) => {
  setNoCache(res);
  const engagementMap: Record<
    string,
    { viewCount: number; likeCount: number; likedBy: string[]; commentCount: number }
  > = {};

  for (const article of db.articles) {
    engagementMap[String(article.id)] = {
      viewCount: typeof article.views === 'number' && article.views > 0 ? article.views : 0,
      likeCount:
        typeof article.likeCount === 'number' && article.likeCount > 0 ? article.likeCount : 0,
      likedBy: Array.isArray(article.likedBy) ? article.likedBy : [],
      commentCount:
        typeof article.commentCount === 'number' && article.commentCount > 0
          ? article.commentCount
          : 0,
    };
  }

  res.json(engagementMap);
});

router.post('/:id/view', async (req, res) => {
  setNoCache(res);
  const param = req.params.id;
  const numId = parseInt(param, 10);
  const article = db.articles.find((a) => (!isNaN(numId) && a.id === numId) || a.slug === param);

  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }

  const clientCount =
    typeof req.body?.clientViewCount === 'number' && req.body.clientViewCount > 0
      ? Math.floor(req.body.clientViewCount)
      : 0;

  const currentViews = typeof article.views === 'number' && article.views > 0 ? article.views : 0;
  article.views = Math.max(currentViews + 1, clientCount);

  try {
    await db.write();
  } catch (err) {
    console.warn('Non-fatal db.write error on article view increment:', err);
  }

  void syncArticleEngagementToFirestore(article.id, {
    viewCount: article.views,
    likeCount: article.likeCount || 0,
    likedBy: article.likedBy || [],
    commentCount: article.commentCount || 0,
  });

  return res.json({
    id: article.id,
    viewCount: article.views,
    likeCount: article.likeCount || 0,
    likedBy: article.likedBy || [],
    commentCount: article.commentCount || 0,
  });
});

router.post('/:id/like', async (req, res) => {
  setNoCache(res);
  const param = req.params.id;
  const numId = parseInt(param, 10);
  const article = db.articles.find((a) => (!isNaN(numId) && a.id === numId) || a.slug === param);

  if (!article) {
    return res.status(404).json({ message: 'Article not found' });
  }

  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const likedBy = new Set<string>(Array.isArray(article.likedBy) ? article.likedBy : []);
  if (likedBy.has(userId)) {
    likedBy.delete(userId);
  } else {
    likedBy.add(userId);
  }

  article.likedBy = Array.from(likedBy);
  article.likeCount = article.likedBy.length;

  try {
    await db.write();
  } catch (err) {
    console.warn('Non-fatal db.write error on article like toggle:', err);
  }

  void syncArticleEngagementToFirestore(article.id, {
    viewCount: article.views || 0,
    likeCount: article.likeCount,
    likedBy: article.likedBy,
    commentCount: article.commentCount || 0,
  });

  return res.json({
    id: article.id,
    viewCount: article.views || 0,
    likeCount: article.likeCount,
    likedBy: article.likedBy,
    commentCount: article.commentCount || 0,
    isLiked: likedBy.has(userId),
  });
});

router.get('/:id', async (req, res) => {
  const param = req.params.id;
  const numId = parseInt(param, 10);
  const article = db.articles.find((a) => (!isNaN(numId) && a.id === numId) || a.slug === param);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ message: 'Article not found' });
  }
});

export default router;
