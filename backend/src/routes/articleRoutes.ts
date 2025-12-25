import express from 'express';
import { MOCK_ARTICLES } from '../data/mockData';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(MOCK_ARTICLES);
});

router.get('/:id', (req, res) => {
  const article = MOCK_ARTICLES.find((a) => a.id === parseInt(req.params.id));
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ message: 'Article not found' });
  }
});

export default router;
