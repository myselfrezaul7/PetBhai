import { Router } from 'express';
import { db } from '../db';
import type { Order } from '../types';

const router = Router();

// Create Order
router.post('/', (req, res) => {
  const orderData = req.body;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ message: 'Invalid order data' });
  }

  const newOrder: Order = {
    ...orderData,
    orderId: `PB-${Date.now()}`, // Generate a simple ID
    date: new Date().toISOString(),
  };

  db.orders.push(newOrder);

  // If userId is provided, add to user's history
  if (orderData.userId) {
    const user = db.users.find((u) => u.id === orderData.userId);
    if (user) {
      user.orderHistory.unshift(newOrder);
    }
  }

  res.status(201).json(newOrder);
});

// Get User Orders
router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    res.json(user.orderHistory);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
