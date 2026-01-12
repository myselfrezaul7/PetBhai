import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.vets);
});

router.get('/:id', (req, res) => {
  const vet = db.vets.find((v) => v.id === parseInt(req.params.id));
  if (vet) {
    res.json(vet);
  } else {
    res.status(404).json({ message: 'Vet not found' });
  }
});

export default router;
