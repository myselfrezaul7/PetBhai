import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(db.articles);
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
