import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.articles);
});

router.get('/:id', (req, res) => {
  const article = db.articles.find((a) => a.id === parseInt(req.params.id));
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ message: 'Article not found' });
  }
});

export default router;
