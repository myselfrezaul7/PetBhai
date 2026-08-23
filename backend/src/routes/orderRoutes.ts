import { Router, Response } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { db } from '../db';
import type { CartItem, Order, Product } from '../types';
import { AuthRequest, optionalAuth, requireAuth, requireAdmin } from '../middleware/auth';
import { orderLimiter } from '../middleware/rateLimiter';
import { securityLog } from '../middleware/logger';
import { emitAdminEvent } from '../realtime/adminEvents';

const router = Router();

const orderCreateSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).max(250),
          quantity: z.number().int().min(1).max(99),
          imageUrl: z.string().max(3000).optional(),
          price: z.number().positive().finite(),
        })
      )
      .min(1)
      .max(100),
    total: z.number().positive().finite().optional(),
    userId: z.number().int().positive().optional(),
    shippingAddress: z.object({
      name: z.string().min(2).max(100),
      phone: z.string().min(7).max(30),
      address: z.string().min(5).max(500),
      email: z.string().email().optional(),
      city: z.string().min(2).max(100).optional(),
      district: z.string().min(2).max(100).optional(),
      postalCode: z.string().max(20).optional(),
    }),
    paymentMethod: z.string().min(2).max(40),
  })
  .strict();

const orderCancelSchema = z
  .object({
    reason: z.string().min(2).max(500).optional(),
  })
  .strict();

const orderStatusUpdateSchema = z
  .object({
    status: z.enum([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ]),
    note: z.string().trim().min(2).max(500).optional(),
    trackingNumber: z.string().trim().min(3).max(120).optional(),
  })
  .strict();

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
  userId?: number;
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
    email?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
}

const reorderCadenceDaysByCategory: Record<string, number> = {
  'Dog Food': 30,
  'Cat Food': 30,
  'Dog Supplies': 45,
  'Cat Supplies': 45,
  Grooming: 60,
  Accessories: 75,
};

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

// Helper function to send email
async function sendOrderEmail(order: ExtendedOrder) {
  // Check for credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      'Email credentials (EMAIL_USER, EMAIL_PASS) not found in env. Skipping email notification.'
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const customerEmail =
    order.shippingAddress?.email ||
    db.users.find((user) => Number(user.id) === Number(order.userId))?.email ||
    process.env.EMAIL_USER;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `New Order Placed: ${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">New Order Placed</h1>
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        <p><strong>Status:</strong> <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px;">${order.status}</span></p>
        
        <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Customer Details</h3>
        <p><strong>Name:</strong> ${order.shippingAddress?.name || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.shippingAddress?.address || 'N/A'}</p>
        ${order.shippingAddress?.city ? `<p><strong>City:</strong> ${order.shippingAddress.city}</p>` : ''}
        
        <h3 style="border-bottom: 2px solid #ddd; padding-bottom: 5px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Price</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  <div style="font-weight: bold;">${item.name}</div>
                  <div style="font-size: 0.8em; color: #666;">ID: ${item.id}</div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">৳${item.price}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">৳${item.price * item.quantity}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0;">Total Amount: <span style="color: #f97316;">৳${order.total}</span></h3>
          <p style="margin-bottom: 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash on Delivery'}</p>
        </div>
        
        <div style="margin-top: 30px; font-size: 0.8em; color: #888; text-align: center;">
          <p>This is an automated notification from PetBhai System.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Order notification email sent: ${info.messageId}`);

    if (customerEmail && customerEmail !== 'petbhaibd@gmail.com') {
      await transporter.sendMail({
        ...mailOptions,
        to: 'petbhaibd@gmail.com',
        subject: `Order Alert: ${order.orderId}`,
      });
    }
  } catch (error) {
    console.error('Error sending order email:', error);
  }
}

// Create Order
router.post('/', orderLimiter, optionalAuth, async (req: AuthRequest, res) => {
  const parseResult = orderCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      message: 'Invalid order data',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const orderData = parseResult.data;
  const requesterId = req.user ? String(req.user.id) : null;
  const hasRequester =
    requesterId !== null && Number.isFinite(Number(requesterId)) && Number(requesterId) > 0;

  if (typeof orderData.userId === 'number') {
    if (!hasRequester || String(requesterId) !== String(orderData.userId)) {
      securityLog('ORDER_USER_ID_MISMATCH', req, {
        requesterId,
        payloadUserId: orderData.userId,
      });
      return res.status(403).json({
        message: 'Invalid user association for this order',
      });
    }
  }

  const resolvedUserId = hasRequester ? requesterId : undefined;

  // Validate each item has required fields
  let validatedItems: CartItem[] = [];
  try {
    // Validate against latest product state and recalculate total on server
    validatedItems = orderData.items.map((item) => {
      const product = db.products.find((p) => p.id === item.id) as Product | undefined;

      if (!product) {
        throw new Error(`Product with ID ${item.id} no longer exists`);
      }

      if (product.stockStatus === ('out-of-stock' as const)) {
        throw new Error(`${product.name || 'Product'} is out of stock`);
      }

      const stockQuantity = (product as Product & { stockQuantity?: number }).stockQuantity;
      if (typeof stockQuantity === 'number' && item.quantity > stockQuantity) {
        throw new Error(`Only ${stockQuantity} unit(s) available for ${product.name || 'product'}`);
      }

      const serverPrice =
        typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0
          ? product.price
          : item.price;

      return {
        ...product,
        name: item.name || product.name,
        imageUrl: item.imageUrl || product.imageUrl,
        price: serverPrice,
        quantity: item.quantity,
      };
    });
  } catch (inventoryError) {
    return res.status(400).json({
      message: inventoryError instanceof Error ? inventoryError.message : 'Invalid order items',
    });
  }

  const calculatedTotal = validatedItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  if (!Number.isFinite(calculatedTotal) || calculatedTotal <= 0) {
    return res.status(400).json({ message: 'Invalid order total' });
  }

  // Track stock changes for potential rollback
  const stockSnapshot: Array<{ id: number; originalQuantity: number; originalStatus: string }> = [];
  const updatedProductsInfo: Array<{ id: number; stockQuantity: number; stockStatus: string }> = [];

  try {
    // Deduct inventory
    validatedItems.forEach((item) => {
      const productList = db.products as Array<
        Product & { stockQuantity?: number; reorderPoint?: number; stockStatus: string }
      >;
      const dbProduct = productList.find((p) => p.id === item.id);
      if (dbProduct && typeof dbProduct.stockQuantity === 'number') {
        // Snapshot before mutation for rollback
        stockSnapshot.push({
          id: dbProduct.id,
          originalQuantity: dbProduct.stockQuantity,
          originalStatus: dbProduct.stockStatus,
        });

        dbProduct.stockQuantity = Math.max(0, dbProduct.stockQuantity - item.quantity);

        if (dbProduct.stockQuantity <= 0) {
          dbProduct.stockStatus = 'out-of-stock' as const;
        } else if (
          dbProduct.reorderPoint !== undefined &&
          dbProduct.stockQuantity <= dbProduct.reorderPoint
        ) {
          dbProduct.stockStatus = 'low-stock' as const;
        } else {
          dbProduct.stockStatus = 'in-stock' as const;
        }

        updatedProductsInfo.push({
          id: dbProduct.id,
          stockQuantity: dbProduct.stockQuantity,
          stockStatus: dbProduct.stockStatus,
        });
      }
    });

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const newOrder: ExtendedOrder = {
      ...orderData,
      userId: resolvedUserId ? Number(resolvedUserId) : undefined,
      items: validatedItems,
      orderId,
      date: now,
      total: calculatedTotal,
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
    if (resolvedUserId) {
      const user = db.users.find((u) => Number(u.id) === Number(resolvedUserId));
      if (user) {
        // Initialize orderHistory if not exists
        if (!user.orderHistory) user.orderHistory = [];
        user.orderHistory.unshift(newOrder);
      }
    }

    await db.write();
    emitAdminEvent('order-created', {
      orderId: newOrder.orderId,
      status: newOrder.status,
      total: newOrder.total,
    });

    // Send email notification asynchronously
    sendOrderEmail(newOrder).catch((err) => console.error('Failed to trigger email:', err));

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder,
      inventoryUpdates: updatedProductsInfo,
    });
  } catch (orderError) {
    // Rollback stock changes
    for (const snap of stockSnapshot) {
      const productList = db.products as Array<
        Product & { stockQuantity?: number; stockStatus: string }
      >;
      const dbProduct = productList.find((p) => p.id === snap.id);
      if (dbProduct) {
        dbProduct.stockQuantity = snap.originalQuantity;
        dbProduct.stockStatus = snap.originalStatus as any;
      }
    }
    console.error('Order creation failed, stock rolled back:', orderError);
    return res.status(500).json({
      message: 'Failed to create order. Inventory has been restored.',
    });
  }
});

// Get all orders (admin only)
router.get('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
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

// Smart reorder suggestions (authenticated user only)
router.get('/reorder-suggestions', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requesterId = String(req.user.id);
  if (!Number.isFinite(Number(requesterId))) {
    return res.status(400).json({ message: 'Invalid user context' });
  }

  const user = db.users.find((u) => Number(u.id) === Number(requesterId));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const productStats = new Map<
    number,
    {
      quantityTotal: number;
      orderCount: number;
      lastOrderedAt: string;
    }
  >();

  for (const order of user.orderHistory || []) {
    if (order.status === 'cancelled' || order.status === 'refunded') {
      continue;
    }

    for (const item of order.items) {
      const current = productStats.get(item.id);
      if (!current) {
        productStats.set(item.id, {
          quantityTotal: item.quantity,
          orderCount: 1,
          lastOrderedAt: order.date,
        });
        continue;
      }

      current.quantityTotal += item.quantity;
      current.orderCount += 1;
      if (new Date(order.date).getTime() > new Date(current.lastOrderedAt).getTime()) {
        current.lastOrderedAt = order.date;
      }
    }
  }

  const now = Date.now();
  const suggestions = Array.from(productStats.entries())
    .map(([productId, stat]) => {
      const product = db.products.find((p) => p.id === productId);
      if (!product || product.stockStatus === ('out-of-stock' as const)) {
        return null;
      }

      const cadenceDays = reorderCadenceDaysByCategory[product.category] || 45;
      const lastOrderTime = new Date(stat.lastOrderedAt).getTime();
      if (!Number.isFinite(lastOrderTime)) {
        return null;
      }

      const daysSinceOrder = Math.max(0, (now - lastOrderTime) / (1000 * 60 * 60 * 24));
      const readinessRatio = daysSinceOrder / cadenceDays;
      const reorderScore = readinessRatio + Math.min(0.5, Math.log(stat.quantityTotal + 1) * 0.1);

      return {
        product,
        suggestedQuantity: Math.max(1, Math.round(stat.quantityTotal / stat.orderCount)),
        lastOrderedAt: stat.lastOrderedAt,
        reason:
          readinessRatio >= 1
            ? `Usually reordered every ~${cadenceDays} days`
            : `Likely needed soon (typical cycle: ~${cadenceDays} days)`,
        reorderScore,
      };
    })
    .filter(
      (
        item
      ): item is {
        product: Product;
        suggestedQuantity: number;
        lastOrderedAt: string;
        reason: string;
        reorderScore: number;
      } => item !== null && item.reorderScore >= 0.6
    )
    .sort((a, b) => b.reorderScore - a.reorderScore)
    .slice(0, 8)
    .map(({ reorderScore: _score, ...rest }) => rest);

  return res.json(suggestions);
});

// Get order by ID
router.get('/:orderId', requireAuth, async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const order = db.orders.find((o) => o.orderId === orderId) as
    | (ExtendedOrder & {
        userId?: number;
      })
    | null;

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requesterId = String(req.user.id);
  const isOwner =
    Number.isFinite(Number(requesterId)) && Number(order.userId) === Number(requesterId);
  if (!isOwner && !req.user.isAdmin) {
    securityLog('ORDER_READ_FORBIDDEN', req, {
      requesterId,
      orderId,
      ownerId: order.userId,
    });
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(order);
});

// Get User Orders
router.get('/user/:userId', requireAuth, async (req: AuthRequest, res) => {
  const userId = String(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requesterId = String(req.user.id);
  if (!Number.isFinite(Number(requesterId)) || (requesterId !== userId && !req.user.isAdmin)) {
    securityLog('ORDER_HISTORY_FORBIDDEN', req, {
      requesterId,
      requestedUserId: userId,
    });
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = db.users.find((u) => String(u.id) === String(userId));

  if (user) {
    res.json(user.orderHistory);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Update order status (admin only)
router.patch(
  '/:orderId/status',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const parseResult = orderStatusUpdateSchema.safeParse(req.body || {});
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Invalid status update payload',
        details: parseResult.error.errors.map((error) => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      });
    }

    const { status, note, trackingNumber } = parseResult.data;

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
      note: note ?? `Status updated to ${status}`,
    });

    // Add tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    securityLog('ORDER_STATUS_UPDATED', req, {
      orderId,
      status,
      hasTrackingNumber: Boolean(trackingNumber),
    });

    db.orders[orderIndex] = order;

    // Update user's order history if user exists
    if ((order as any).userId) {
      const user = db.users.find((u) => String(u.id) === String((order as any).userId));
      if (user) {
        // Initialize orderHistory if not exists
        if (!user.orderHistory) user.orderHistory = [];
        const userOrderIndex = user.orderHistory.findIndex((o) => o.orderId === orderId);
        if (userOrderIndex !== -1) {
          user.orderHistory[userOrderIndex] = order;
        }
      }
    }

    await db.write();
    emitAdminEvent('order-updated', {
      orderId,
      status: order.status,
      trackingNumber: order.trackingNumber,
    });

    res.json({
      message: 'Order status updated',
      order,
    });
  }
);

// Cancel order (user can cancel pending orders)
router.post('/:orderId/cancel', requireAuth, async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const parseResult = orderCancelSchema.safeParse(req.body || {});
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid cancellation request' });
  }

  const { reason } = parseResult.data;

  const orderIndex = db.orders.findIndex((o) => o.orderId === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const order = db.orders[orderIndex] as ExtendedOrder & { userId?: number };

  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requesterId = String(req.user.id);
  const isOwner =
    Number.isFinite(Number(requesterId)) && Number(order.userId) === Number(requesterId);
  if (!isOwner && !req.user.isAdmin) {
    securityLog('ORDER_CANCEL_FORBIDDEN', req, {
      requesterId,
      orderId,
      ownerId: order.userId,
    });
    return res.status(403).json({ message: 'Forbidden' });
  }

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

  await db.write();
  emitAdminEvent('order-cancelled', {
    orderId,
    status: order.status,
  });

  res.json({
    message: 'Order cancelled successfully',
    order,
  });
});

// Track order (public)
router.get('/:orderId/track', async (req, res) => {
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
router.get('/stats/summary', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
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
