import express from 'express';
import { db } from '../db';

const router = express.Router();

// Get all brands
router.get('/', async (req, res) => {
  res.json(db.brands);
});

// Get single brand by ID
router.get('/:id', async (req, res) => {
  const brand = db.brands.find((b) => b.id === parseInt(req.params.id));
  if (brand) {
    res.json(brand);
  } else {
    res.status(404).json({ message: 'Brand not found' });
  }
});

export default router;
