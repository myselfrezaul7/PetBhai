import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.products);
});

router.get('/:id', (req, res) => {
  const product = db.products.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

export default router;
