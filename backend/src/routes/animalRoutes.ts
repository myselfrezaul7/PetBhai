import express from 'express';
import { db } from '../db';

const router = express.Router();

// Get all animals
router.get('/', async (req, res) => {
  res.json(db.animals);
});

// Get single animal by ID
router.get('/:id', async (req, res) => {
  const animal = db.animals.find((a) => a.id === parseInt(req.params.id));
  if (animal) {
    res.json(animal);
  } else {
    res.status(404).json({ message: 'Animal not found' });
  }
});

export default router;
