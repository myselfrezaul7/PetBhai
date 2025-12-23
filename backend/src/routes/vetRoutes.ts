import express from 'express';
import { MOCK_VETS } from '../data/mockData';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(MOCK_VETS);
});

router.get('/:id', (req, res) => {
  const vet = MOCK_VETS.find((v) => v.id === parseInt(req.params.id));
  if (vet) {
    res.json(vet);
  } else {
    res.status(404).json({ message: 'Vet not found' });
  }
});

export default router;
