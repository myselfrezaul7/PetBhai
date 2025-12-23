import express from 'express';
import { MOCK_ANIMALS } from '../data/mockData';

const router = express.Router();

// Get all animals
router.get('/', (req, res) => {
  res.json(MOCK_ANIMALS);
});

// Get single animal by ID
router.get('/:id', (req, res) => {
  const animal = MOCK_ANIMALS.find((a) => a.id === parseInt(req.params.id));
  if (animal) {
    res.json(animal);
  } else {
    res.status(404).json({ message: 'Animal not found' });
  }
});

export default router;
