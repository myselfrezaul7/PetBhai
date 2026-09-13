import express from 'express';
import { db } from '../db';
import type { Question } from '../types';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Simple in-memory rate limiter: max 5 questions per 15 minutes per IP
const submissionTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins
const MAX_SUBMISSIONS = 5;

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

// GET /api/questions - List questions (admin access or public view)
router.get('/', async (req, res) => {
  try {
    const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : null;
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : null;

    let results = [...db.questions];

    if (topic && topic !== 'All') {
      results = results.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
    }

    if (status) {
      results = results.filter((q) => q.status === status);
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(results);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to retrieve questions' });
  }
});

// POST /api/questions - Submit a new question
router.post('/', rateLimitQuestions, async (req, res) => {
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

    const newQuestion: Question = {
      id: Date.now(),
      name: sanitizedName,
      email: sanitizedEmail,
      topic: sanitizedTopic,
      question: question.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    db.questions.push(newQuestion);
    await db.write().catch((err) => {
      console.warn('Persistence warning for question submission:', err.message);
    });

    res.status(201).json({
      success: true,
      message:
        'Question received! Our pet care team will review it and answer in an upcoming blog post.',
      question: newQuestion,
    });
  } catch (err) {
    console.error('Error submitting question:', err);
    res.status(500).json({ error: 'Failed to submit question. Please try again later.' });
  }
});

// PATCH /api/questions/:id - Update question status or answered blog link (admin/moderator)
router.patch(
  '/:id',
  requireAuth,
  requireRole(['super_admin', 'store_manager', 'moderator']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      const questionIndex = db.questions.findIndex((q) => q.id === id);
      if (questionIndex === -1) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const { status, answeredBlogSlug } = req.body;
      if (status && !['pending', 'answered', 'rejected'].includes(status)) {
        return res
          .status(400)
          .json({ error: 'Invalid status. Must be pending, answered, or rejected.' });
      }

      if (status) {
        db.questions[questionIndex].status = status;
      }
      if (typeof answeredBlogSlug === 'string') {
        db.questions[questionIndex].answeredBlogSlug = answeredBlogSlug.trim();
      }

      await db.write().catch((err) => {
        console.warn('Persistence warning for question update:', err.message);
      });

      res.json({
        success: true,
        message: 'Question updated successfully',
        question: db.questions[questionIndex],
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
