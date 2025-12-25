import { Router } from 'express';
import { db } from '../db';
import type { Order } from '../types';

const router = Router();

// Create Order
router.post('/', (req, res) => {
  const orderData = req.body;

  if (!orderData || typeof orderData !== 'object') {
    return res.status(400).json({ message: 'Invalid order data' });
  }

  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  // Validate each item has required fields
  const invalidItems = orderData.items.some(
    (item: any) =>
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'number' ||
      typeof item.quantity !== 'number' ||
      item.quantity <= 0
  );

  if (invalidItems) {
    return res.status(400).json({ message: 'Invalid item data in order' });
  }

  // Calculate total if not provided
  const calculatedTotal = orderData.items.reduce(
    (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
    0
  );

  const newOrder: Order = {
    ...orderData,
    orderId: `PB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a unique ID
    date: new Date().toISOString(),
    total: orderData.total || calculatedTotal,
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
