import express from 'express';
import { MOCK_PRODUCTS } from '../data/mockData';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(MOCK_PRODUCTS);
});

router.get('/:id', (req, res) => {
  const product = MOCK_PRODUCTS.find((p) => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

export default router;
