import { Router, Response } from 'express';
import { db } from '../db';
import type { Order } from '../types';
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { orderLimiter } from '../middleware/rateLimiter';

const router = Router();

// Order status types
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Extended order type with tracking
interface ExtendedOrder extends Order {
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode?: string;
  };
}

// Generate unique order ID
const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PB-${timestamp}-${random}`;
};

// Calculate estimated delivery (3-7 business days)
const calculateEstimatedDelivery = (): string => {
  const today = new Date();
  const deliveryDays = Math.floor(Math.random() * 5) + 3; // 3-7 days
  today.setDate(today.getDate() + deliveryDays);
  return today.toISOString();
};

// Create Order
router.post('/', orderLimiter, (req, res) => {
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

  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const newOrder: ExtendedOrder = {
    ...orderData,
    orderId,
    date: now,
    total: orderData.total || calculatedTotal,
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        timestamp: now,
        note: 'Order placed successfully',
      },
    ],
    estimatedDelivery: calculateEstimatedDelivery(),
    shippingAddress: orderData.shippingAddress,
  };

  db.orders.push(newOrder);

  // If userId is provided, add to user's history
  if (orderData.userId) {
    const user = db.users.find((u) => u.id === orderData.userId);
    if (user) {
      user.orderHistory.unshift(newOrder);
    }
  }

  res.status(201).json({
    message: 'Order placed successfully',
    order: newOrder,
  });
});

// Get all orders (admin only)
router.get('/', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;

  let orders = [...db.orders];

  // Filter by status if provided
  if (status && typeof status === 'string') {
    orders = orders.filter((o: any) => o.status === status);
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedOrders = orders.slice(startIndex, endIndex);

  res.json({
    orders: paginatedOrders,
    pagination: {
      total: orders.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(orders.length / limitNum),
    },
  });
});

// Get order by ID
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = db.orders.find((o) => o.orderId === orderId);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
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

// Update order status (admin only)
router.patch('/:orderId/status', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const { status, note, trackingNumber } = req.body;

  const validStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const orderIndex = db.orders.findIndex((o) => o.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const order = db.orders[orderIndex] as ExtendedOrder;
  const now = new Date().toISOString();

  // Update order status
  order.status = status;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status,
    timestamp: now,
    note: note || `Status updated to ${status}`,
  });

  // Add tracking number if provided
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  db.orders[orderIndex] = order;

  // Update user's order history if user exists
  if ((order as any).userId) {
    const user = db.users.find((u) => u.id === (order as any).userId);
    if (user) {
      const userOrderIndex = user.orderHistory.findIndex((o) => o.orderId === orderId);
      if (userOrderIndex !== -1) {
        user.orderHistory[userOrderIndex] = order;
      }
    }
  }

  res.json({
    message: 'Order status updated',
    order,
  });
});

// Cancel order (user can cancel pending orders)
router.post('/:orderId/cancel', (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const orderIndex = db.orders.findIndex((o) => o.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const order = db.orders[orderIndex] as ExtendedOrder;

  // Only allow cancellation of pending or confirmed orders
  if (order.status && !['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({
      message: 'Order cannot be cancelled at this stage',
    });
  }

  const now = new Date().toISOString();
  order.status = 'cancelled';
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: now,
    note: reason || 'Cancelled by customer',
  });

  db.orders[orderIndex] = order;

  res.json({
    message: 'Order cancelled successfully',
    order,
  });
});

// Track order (public)
router.get('/:orderId/track', (req, res) => {
  const { orderId } = req.params;
  const order = db.orders.find((o) => o.orderId === orderId) as ExtendedOrder | undefined;

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json({
    orderId: order.orderId,
    status: order.status || 'pending',
    statusHistory: order.statusHistory || [],
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
  });
});

// Get order statistics (admin only)
router.get('/stats/summary', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  const orders = db.orders as ExtendedOrder[];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    todayOrders: orders.filter((o) => {
      const orderDate = new Date(o.date).toDateString();
      const today = new Date().toDateString();
      return orderDate === today;
    }).length,
  };

  res.json(stats);
});

export default router;
