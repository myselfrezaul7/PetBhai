import express from 'express';
import { MOCK_BRANDS } from '../data/mockData';

const router = express.Router();

// Get all brands
router.get('/', (req, res) => {
  res.json(MOCK_BRANDS);
});

// Get single brand by ID
router.get('/:id', (req, res) => {
  const brand = MOCK_BRANDS.find((b) => b.id === parseInt(req.params.id));
  if (brand) {
    res.json(brand);
  } else {
    res.status(404).json({ message: 'Brand not found' });
  }
});

export default router;
