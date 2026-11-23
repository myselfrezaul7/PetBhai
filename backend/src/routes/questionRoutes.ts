import express from 'express';
import { db } from '../db';
import type { Article, Question } from '../types';
import { optionalAuth, requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import {
  syncQuestionToFirestore,
  deleteQuestionFromFirestore,
  fetchQuestionsFromFirestore,
} from '../services/firestoreSync';

const router = express.Router();

const FIRESTORE_SYNC_TIMEOUT_MS = 2500;

// Simple in-memory rate limiter: max 5 questions per 15 minutes per IP
const submissionTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins
const MAX_SUBMISSIONS = 5;

const setNoCache = (res: express.Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

const isAdminCaller = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  return Boolean(
    req.user.isAdmin || ['super_admin', 'store_manager', 'moderator'].includes(req.user.role || '')
  );
};

const sanitizePublicQuestion = (question: Question): Question => {
  const { email: _privateEmail, answer, answeredBy, answeredAt, ...baseQuestion } = question;
  if (question.status === 'answered') {
    return {
      ...baseQuestion,
      ...(answer !== undefined ? { answer } : {}),
      ...(answeredBy !== undefined ? { answeredBy } : {}),
      ...(answeredAt !== undefined ? { answeredAt } : {}),
    };
  }
  return baseQuestion;
};

const rateLimitQuestions = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const now = Date.now();
  const tracker = submissionTracker.get(ip);

  if (!tracker || now > tracker.resetTime) {
    submissionTracker.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (tracker.count >= MAX_SUBMISSIONS) {
    return res.status(429).json({
      error:
        'Too many questions submitted. Please wait a few minutes before asking another question.',
    });
  }

  tracker.count++;
  next();
};

// Bilingual keyword clusters so English & Bangla visitor questions match the most relevant article
const BILINGUAL_CLUSTERS: Array<{ id: string; weight: number; terms: string[] }> = [
  {
    id: 'dog',
    weight: 4,
    terms: ['dog', 'puppy', 'deshi', 'canine', 'কুকুর', 'কুকুরছানা', 'দেশি'],
  },
  {
    id: 'cat',
    weight: 4,
    terms: [
      'cat',
      'kitten',
      'feline',
      'persian',
      'বিড়াল',
      'বিড়াল',
      'বিড়ালছানা',
      'পার্সিয়ান',
      'পার্শিয়ান',
    ],
  },
  {
    id: 'heat',
    weight: 9,
    terms: [
      'summer',
      'hot',
      'heat',
      'heatstroke',
      'dehydration',
      'cool',
      'গরম',
      'গরমকাল',
      'হিটস্ট্রোক',
      'ডিহাইড্রেশন',
      'সতেজ',
    ],
  },
  { id: 'winter', weight: 8, terms: ['winter', 'cold', 'warm', 'শীত', 'শীতকাল', 'ঠান্ডা'] },
  { id: 'monsoon', weight: 8, terms: ['rain', 'monsoon', 'wet', 'বর্ষা', 'বৃষ্টি'] },
  {
    id: 'vaccine',
    weight: 10,
    terms: [
      'vaccine',
      'vaccination',
      'booster',
      'shot',
      'টিকা',
      'ভ্যাকসিন',
      'ভ্যাকসিনেশন',
      'বুস্টার',
      'tika',
    ],
  },
  {
    id: 'rabies',
    weight: 12,
    terms: ['rabies', 'জলাতঙ্ক', 'jolotongko'],
  },
  {
    id: 'ear',
    weight: 10,
    terms: ['ear', 'ears', 'mites', 'infection', 'কান', 'কানে', 'মাইটস', 'ইনফেকশন'],
  },
  { id: 'eye', weight: 9, terms: ['eye', 'eyes', 'tear', 'চোখ', 'চোখের'] },
  {
    id: 'food',
    weight: 8,
    terms: [
      'food',
      'feed',
      'feeding',
      'diet',
      'nutrition',
      'chicken',
      'pumpkin',
      'recipe',
      'homemade',
      'meal',
      'kibble',
      'খাবার',
      'খাদ্য',
      'ডায়েট',
      'পুষ্টি',
      'রেসিপি',
      'মুরগি',
      'কুমড়া',
      'হজম',
    ],
  },
  {
    id: 'toxic',
    weight: 10,
    terms: [
      'toxic',
      'poison',
      'chocolate',
      'onion',
      'grape',
      'chemical',
      'বিষাক্ত',
      'বিষক্রিয়া',
      'ক্ষতিকর',
    ],
  },
  {
    id: 'parasite',
    weight: 9,
    terms: [
      'flea',
      'fleas',
      'tick',
      'ticks',
      'lice',
      'parasite',
      'heartworm',
      'টিক',
      'ফ্লি',
      'উকুন',
      'পরজীবী',
      'হার্টওয়ার্ম',
    ],
  },
  { id: 'deworm', weight: 9, terms: ['worm', 'deworm', 'deworming', 'কৃমি', 'ডিওয়ার্মিং'] },
  {
    id: 'hairball',
    weight: 9,
    terms: ['hairball', 'shedding', 'fur', 'coat', 'হেয়ারবল', 'চুল পড়া', 'লোম'],
  },
  {
    id: 'scratch_nail',
    weight: 9,
    terms: [
      'nail',
      'nails',
      'claw',
      'claws',
      'scratch',
      'scratching',
      'furniture',
      'নখ',
      'আঁচড়ানো',
      'আঁচড়ানো',
    ],
  },
  {
    id: 'litter_urine',
    weight: 10,
    terms: [
      'litter',
      'urine',
      'urinary',
      'blockage',
      'pee',
      'kidney',
      'লিটার',
      'প্রস্রাব',
      'ইউরিন',
      'কিডনি',
    ],
  },
  {
    id: 'training',
    weight: 9,
    terms: [
      'bark',
      'barking',
      'train',
      'training',
      'behavior',
      'anxiety',
      'separation',
      'hyper',
      'ঘেউ',
      'ট্রেইনিং',
      'প্রশিক্ষণ',
      'আচরণ',
      'আতঙ্ক',
    ],
  },
  {
    id: 'grooming',
    weight: 8,
    terms: ['bath', 'bathe', 'shampoo', 'groom', 'grooming', 'গোসল', 'গ্রুমিং'],
  },
  {
    id: 'dental',
    weight: 9,
    terms: ['teeth', 'tooth', 'dental', 'brush', 'breath', 'দাঁত', 'মুখ', 'দুর্গন্ধ'],
  },
  {
    id: 'spay',
    weight: 9,
    terms: ['spay', 'neuter', 'pregnant', 'বন্ধ্যাকরণ', 'স্পে', 'নিউটার', 'গর্ভবতী'],
  },
  {
    id: 'emergency',
    weight: 10,
    terms: [
      'vomit',
      'vomiting',
      'parvo',
      'parvovirus',
      'flu',
      'bleeding',
      'wound',
      'choking',
      'seizure',
      'diabetes',
      'first aid',
      'emergency',
      'বমি',
      'পারভোভাইরাস',
      'ফ্লু',
      'শ্বাসকষ্ট',
      'রক্তপাত',
      'ক্ষত',
      'শ্বাসরোধ',
      'খিঁচুনি',
      'ডায়াবেটিস',
      'জরুরি',
    ],
  },
  {
    id: 'rescue_adopt',
    weight: 8,
    terms: [
      'adopt',
      'adoption',
      'rescue',
      'stray',
      'street',
      'newborn',
      'bottle',
      'milk',
      'দত্তক',
      'রেসকিউ',
      'রাস্তা',
      'নবজাতক',
      'দুধ',
    ],
  },
  {
    id: 'indoor',
    weight: 7,
    terms: [
      'flat',
      'apartment',
      'indoor',
      'toy',
      'toys',
      'neighbor',
      'ফ্ল্যাট',
      'ইনডোর',
      'খেলনা',
      'প্রতিবেশী',
    ],
  },
];

const tokenizeText = (input: string): string[] =>
  input
    .toLowerCase()
    .split(/[^a-z0-9\u0980-\u09FF]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const textContainsTerm = (haystack: string, tokens: Set<string>, term: string): boolean => {
  if (term.includes(' ')) {
    return haystack.includes(term);
  }
  return tokens.has(term) || haystack.includes(term);
};

const matchRelevantArticle = (
  topic: string,
  questionText: string,
  articles: Article[]
): { answeredBlogSlug: string; answeredBlogTitle: string } | null => {
  if (!Array.isArray(articles) || articles.length === 0) return null;

  const combinedQuery = `${topic} ${questionText}`.toLowerCase();
  const queryTokens = new Set(tokenizeText(combinedQuery));
  const topicLower = topic.toLowerCase();

  const activeClusters = BILINGUAL_CLUSTERS.filter((cluster) =>
    cluster.terms.some((term) => textContainsTerm(combinedQuery, queryTokens, term))
  );
  const queryIsCatOnly =
    activeClusters.some((c) => c.id === 'cat') && !activeClusters.some((c) => c.id === 'dog');
  const queryIsDogOnly =
    activeClusters.some((c) => c.id === 'dog') && !activeClusters.some((c) => c.id === 'cat');

  let bestArticle: Article | null = null;
  let bestScore = -1;

  for (const article of articles) {
    const titleLower = (article.title || '').toLowerCase();
    const slugLower = (article.slug || '').toLowerCase();
    const categoryLower = (article.category || '').toLowerCase();
    const tagsLower = Array.isArray(article.tags) ? article.tags.join(' ').toLowerCase() : '';
    const excerptLower = (article.excerpt || '').toLowerCase();
    const articlePrimary = `${titleLower} ${slugLower} ${tagsLower} ${categoryLower}`;
    const articleTokens = new Set(tokenizeText(articlePrimary));

    let score = 0;

    // 1. Direct token overlaps
    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 6;
      else if (tagsLower.includes(token) || slugLower.includes(token)) score += 4;
      else if (excerptLower.includes(token)) score += 2;
    }

    // 2. Bilingual semantic cluster overlaps
    for (const cluster of activeClusters) {
      const articleMatchesCluster = cluster.terms.some((term) =>
        textContainsTerm(articlePrimary, articleTokens, term)
      );
      if (articleMatchesCluster) {
        score += cluster.weight;
      }
    }

    // 3. Topic category alignment
    if (topicLower.includes('dog') && categoryLower.includes('dog')) score += 4;
    if (topicLower.includes('cat') && categoryLower.includes('cat')) score += 4;
    if (
      topicLower.includes('health') &&
      (categoryLower.includes('health') ||
        tagsLower.includes('first aid') ||
        tagsLower.includes('vaccine') ||
        tagsLower.includes('emergency'))
    ) {
      score += 4;
    }
    if (
      topicLower.includes('nutrition') &&
      (categoryLower.includes('nutrition') ||
        articlePrimary.includes('খাবার') ||
        articlePrimary.includes('ডায়েট') ||
        articlePrimary.includes('diet') ||
        articlePrimary.includes('food'))
    ) {
      score += 4;
    }
    if (
      topicLower.includes('training') &&
      (categoryLower.includes('training') ||
        categoryLower.includes('behavior') ||
        articlePrimary.includes('ট্রেইনিং') ||
        articlePrimary.includes('আচরণ'))
    ) {
      score += 4;
    }

    // 4. Avoid cross-species mismatch when question specifies one pet clearly
    if (queryIsCatOnly && categoryLower === 'dog care') score -= 4;
    if (queryIsDogOnly && categoryLower === 'cat care') score -= 4;

    if (score > bestScore) {
      bestScore = score;
      bestArticle = article;
    }
  }

  if (!bestArticle || bestScore <= 0) {
    bestArticle =
      articles.find((a) => (a.category || '').toLowerCase().includes(topicLower)) ||
      articles.find((a) => a.featured) ||
      articles[0];
  }

  return bestArticle
    ? {
        answeredBlogSlug: bestArticle.slug || String(bestArticle.id),
        answeredBlogTitle: bestArticle.title,
      }
    : null;
};

const hydrateQuestionsFromFirestore = async (): Promise<void> => {
  const remoteQuestions = await fetchQuestionsFromFirestore(2000);
  if (!Array.isArray(remoteQuestions) || remoteQuestions.length === 0) return;

  const localById = new Map<number, Question>();
  for (const q of db.questions) {
    localById.set(q.id, q);
  }

  for (const remote of remoteQuestions) {
    const existing = localById.get(remote.id);
    if (!existing) {
      db.questions.push(remote);
      localById.set(remote.id, remote);
    } else {
      // Preserve private email stored locally while merging newer helpfulCount/answer fields
      existing.helpfulCount = Math.max(existing.helpfulCount || 0, remote.helpfulCount || 0);
      if (!existing.answer && remote.answer) {
        existing.answer = remote.answer;
        existing.answeredBy = remote.answeredBy;
        existing.answeredAt = remote.answeredAt;
        existing.status = remote.status;
      }
      if (!existing.answeredBlogSlug && remote.answeredBlogSlug) {
        existing.answeredBlogSlug = remote.answeredBlogSlug;
        existing.answeredBlogTitle = remote.answeredBlogTitle;
      }
    }
  }
};

// GET /api/questions - List questions (strips private email & hides rejected for public callers)
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  setNoCache(res);
  try {
    await hydrateQuestionsFromFirestore();

    const admin = isAdminCaller(req);
    const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : null;
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : null;

    let results = [...db.questions];

    if (!admin) {
      results = results.filter((q) => q.status !== 'rejected');
    }

    if (topic && topic !== 'All' && topic.toLowerCase() !== 'all') {
      results = results.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
    }

    if (status && status.toLowerCase() !== 'all') {
      results = results.filter((q) => (q.status || 'pending') === status);
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const payload = admin ? results : results.map(sanitizePublicQuestion);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to retrieve questions' });
  }
});

// POST /api/questions - Submit a new visitor question and auto-match a related blog article
router.post('/', rateLimitQuestions, async (req, res) => {
  setNoCache(res);
  try {
    const { name, email, topic, question } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim().length < 10) {
      return res.status(400).json({
        error: 'Question must be at least 10 characters long.',
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        error: 'Question cannot exceed 1000 characters.',
      });
    }

    const sanitizedTopic =
      typeof topic === 'string' && topic.trim() ? topic.trim().slice(0, 50) : 'General';

    const sanitizedName =
      typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : 'Pet Parent';

    const sanitizedEmail =
      typeof email === 'string' && email.trim() ? email.trim().slice(0, 120) : undefined;

    const trimmedQuestion = question.trim();
    const matchedArticle = matchRelevantArticle(sanitizedTopic, trimmedQuestion, db.articles);

    const newQuestion: Question = {
      id: Date.now(),
      name: sanitizedName,
      email: sanitizedEmail,
      topic: sanitizedTopic,
      question: trimmedQuestion,
      createdAt: new Date().toISOString(),
      status: 'pending',
      answeredBlogSlug: matchedArticle?.answeredBlogSlug,
      answeredBlogTitle: matchedArticle?.answeredBlogTitle,
      helpfulCount: 0,
    };

    db.questions.push(newQuestion);
    await db.write().catch((err) => {
      console.warn('Persistence warning for question submission:', err.message);
    });

    await syncQuestionToFirestore(newQuestion, FIRESTORE_SYNC_TIMEOUT_MS);

    res.status(201).json({
      success: true,
      message:
        'Question received! Our PetBhai Vet Team will review it and publish a detailed answer.',
      question: sanitizePublicQuestion(newQuestion),
    });
  } catch (err) {
    console.error('Error submitting question:', err);
    res.status(500).json({ error: 'Failed to submit question. Please try again later.' });
  }
});

// POST /api/questions/:id/helpful - Increment (or toggle) helpful vote count for a community question
router.post('/:id/helpful', optionalAuth, async (req: AuthRequest, res) => {
  setNoCache(res);
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    let question = db.questions.find((q) => q.id === id);
    if (!question) {
      await hydrateQuestionsFromFirestore();
      question = db.questions.find((q) => q.id === id);
    }

    if (!question || (!isAdminCaller(req) && question.status === 'rejected')) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isDecrement =
      req.body?.delta === -1 || req.body?.action === 'remove' || req.body?.decrement === true;
    const currentCount =
      typeof question.helpfulCount === 'number' && Number.isFinite(question.helpfulCount)
        ? question.helpfulCount
        : 0;

    question.helpfulCount = Math.max(0, currentCount + (isDecrement ? -1 : 1));

    await db.write().catch((err) => {
      console.warn('Persistence warning for question helpful vote:', err.message);
    });

    await syncQuestionToFirestore(question, FIRESTORE_SYNC_TIMEOUT_MS);

    const responseQuestion = isAdminCaller(req) ? question : sanitizePublicQuestion(question);
    res.json({
      success: true,
      helpfulCount: question.helpfulCount,
      question: responseQuestion,
    });
  } catch (err) {
    console.error('Error recording helpful vote:', err);
    res.status(500).json({ error: 'Failed to update helpful count' });
  }
});

// PATCH /api/questions/:id - Update question status, answer, or linked blog guide (admin/moderator)
router.patch(
  '/:id',
  requireAuth,
  requireRole(['super_admin', 'store_manager', 'moderator']),
  async (req: AuthRequest, res) => {
    setNoCache(res);
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      let questionIndex = db.questions.findIndex((q) => q.id === id);
      if (questionIndex === -1) {
        await hydrateQuestionsFromFirestore();
        questionIndex = db.questions.findIndex((q) => q.id === id);
      }

      if (questionIndex === -1) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const { status, answer, answeredBy, answeredBlogSlug, answeredBlogTitle } = req.body || {};
      if (status && !['pending', 'answered', 'rejected'].includes(status)) {
        return res
          .status(400)
          .json({ error: 'Invalid status. Must be pending, answered, or rejected.' });
      }

      const target = db.questions[questionIndex];
      const shouldPublishAnswer =
        status === 'answered' ||
        (status === undefined && typeof answer === 'string' && answer.trim().length > 0);

      if (typeof answer === 'string') {
        const trimmedAnswer = answer.trim().slice(0, 4000);
        target.answer = trimmedAnswer || undefined;
        if (trimmedAnswer && shouldPublishAnswer) {
          target.answeredAt = new Date().toISOString();
          target.answeredBy =
            typeof answeredBy === 'string' && answeredBy.trim()
              ? answeredBy.trim().slice(0, 80)
              : target.answeredBy || 'PetBhai Vet Team';
          target.status = 'answered';
        }
      }

      if (typeof answeredBy === 'string' && answeredBy.trim()) {
        target.answeredBy = answeredBy.trim().slice(0, 80);
      }

      if (status) {
        target.status = status;
        if (status === 'answered') {
          if (!target.answeredAt) {
            target.answeredAt = new Date().toISOString();
          }
          if (!target.answeredBy) {
            target.answeredBy = 'PetBhai Vet Team';
          }
        }
      }

      const hasExplicitBlogTitle =
        typeof answeredBlogTitle === 'string' && answeredBlogTitle.trim().length > 0;

      if (typeof answeredBlogSlug === 'string') {
        const cleanedSlug = answeredBlogSlug.trim();
        target.answeredBlogSlug = cleanedSlug || undefined;

        if (cleanedSlug && !hasExplicitBlogTitle) {
          const matchedArticle = db.articles.find(
            (a) => a.slug === cleanedSlug || String(a.id) === cleanedSlug
          );
          target.answeredBlogTitle = matchedArticle ? matchedArticle.title : undefined;
        } else if (!cleanedSlug && !hasExplicitBlogTitle) {
          target.answeredBlogTitle = undefined;
        }
      }

      if (hasExplicitBlogTitle) {
        target.answeredBlogTitle = answeredBlogTitle.trim();
      } else if (typeof answeredBlogTitle === 'string' && typeof answeredBlogSlug !== 'string') {
        target.answeredBlogTitle = undefined;
      }

      await db.write().catch((err) => {
        console.warn('Persistence warning for question update:', err.message);
      });

      await syncQuestionToFirestore(target, FIRESTORE_SYNC_TIMEOUT_MS, {
        clearUnpublishedAnswer: target.status !== 'answered',
      });

      res.json({
        success: true,
        message: 'Question updated successfully',
        question: target,
      });
    } catch (err) {
      console.error('Error updating question:', err);
      res.status(500).json({ error: 'Failed to update question' });
    }
  }
);

// DELETE /api/questions/:id - Delete a question (admin/moderator)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['super_admin', 'store_manager', 'moderator']),
  async (req, res) => {
    setNoCache(res);
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      const questionIndex = db.questions.findIndex((q) => q.id === id);
      if (questionIndex === -1) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const [deleted] = db.questions.splice(questionIndex, 1);
      await db.write().catch((err) => {
        console.warn('Persistence warning for question deletion:', err.message);
      });

      await deleteQuestionFromFirestore(deleted.id, FIRESTORE_SYNC_TIMEOUT_MS);

      res.json({
        success: true,
        message: 'Question removed successfully',
        question: deleted,
      });
    } catch (err) {
      console.error('Error deleting question:', err);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
);

export default router;
