import express from 'express';
import { db } from '../db';

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(db.vets);
});

router.get('/:id', async (req, res) => {
  const vet = db.vets.find((v) => v.id === parseInt(req.params.id));
  if (vet) {
    res.json(vet);
  } else {
    res.status(404).json({ message: 'Vet not found' });
  }
});

// Book consultation for specific vet
router.post('/:id/book', async (req, res) => {
  const vetId = parseInt(req.params.id);
  const vet = db.vets.find((v) => v.id === vetId);
  if (!vet) {
    return res.status(404).json({ message: 'Vet not found' });
  }

  const { time, date, issue, reason, petName, contactNumber } = req.body || {};
  const consultationReason = issue || reason || '';

  if (!time) {
    return res.status(400).json({ message: 'Preferred time slot is required' });
  }

  const bookingReference = `PB-VET-${Date.now().toString().slice(-6)}`;
  res.status(201).json({
    message: 'Consultation request received successfully',
    booking: {
      referenceId: bookingReference,
      vetId,
      vetName: vet.name,
      clinicName: vet.clinicName,
      time,
      date: date || new Date().toISOString().split('T')[0],
      petName: petName || 'Pet',
      contactNumber: contactNumber || 'Provided',
      reason: consultationReason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

// General consultation request
router.post('/book', async (req, res) => {
  const { vetId, time, date, issue, reason, petName, contactNumber } = req.body || {};
  const targetVet = vetId ? db.vets.find((v) => v.id === parseInt(vetId)) : null;

  const bookingReference = `PB-VET-${Date.now().toString().slice(-6)}`;
  res.status(201).json({
    message: 'Consultation request received successfully',
    booking: {
      referenceId: bookingReference,
      vetId: targetVet ? targetVet.id : null,
      vetName: targetVet ? targetVet.name : 'First Available Doctor',
      time: time || 'Flexible',
      date: date || new Date().toISOString().split('T')[0],
      petName: petName || 'Pet',
      contactNumber: contactNumber || 'Provided',
      reason: issue || reason || 'General Consultation',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

export default router;
