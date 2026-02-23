import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import type { Product } from '../types';
import { AuthRequest, optionalAuth, requireAdmin, requireAuth } from '../middleware/auth';

const router = express.Router();

const reviewCreateSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(1000),
  })
  .strict();

const inventoryUpdateSchema = z
  .object({
    stockQuantity: z.number().int().min(0).max(100000),
    reorderPoint: z.number().int().min(0).max(100000),
  })
  .strict();

const adminProductCreateSchema = z
  .object({
    name: z.string().min(2).max(250),
    category: z.enum([
      'Cat Food',
      'Dog Food',
      'Cat Supplies',
      'Dog Supplies',
      'Grooming',
      'Accessories',
    ]),
    price: z.number().positive().finite(),
    imageUrl: z.string().url().max(3000),
    description: z.string().min(5).max(3000),
    weight: z.string().min(1).max(50),
    brandId: z.number().int().positive(),
    stockQuantity: z.number().int().min(0).max(100000),
    reorderPoint: z.number().int().min(0).max(100000),
  })
  .strict();

const complementaryCategories: Record<string, Array<Product['category']>> = {
  'Dog Food': ['Dog Supplies', 'Grooming', 'Accessories'],
  'Cat Food': ['Cat Supplies', 'Grooming', 'Accessories'],
  'Dog Supplies': ['Dog Food', 'Grooming', 'Accessories'],
  'Cat Supplies': ['Cat Food', 'Grooming', 'Accessories'],
  Grooming: ['Dog Supplies', 'Cat Supplies', 'Accessories'],
  Accessories: ['Dog Supplies', 'Cat Supplies', 'Grooming'],
};

const inferStockQuantity = (product: Product): number => {
  if (typeof product.stockQuantity === 'number' && Number.isFinite(product.stockQuantity)) {
    return Math.max(0, Math.floor(product.stockQuantity));
  }

  if (product.stockStatus === 'out-of-stock') return 0;
  if (product.stockStatus === 'low-stock') return 10;
  return 120;
};

const inferReorderPoint = (product: Product): number => {
  if (typeof product.reorderPoint === 'number' && Number.isFinite(product.reorderPoint)) {
    return Math.max(0, Math.floor(product.reorderPoint));
  }
  return 20;
};

const deriveStockStatus = (stockQuantity: number, reorderPoint: number): Product['stockStatus'] => {
  if (stockQuantity <= 0) return 'out-of-stock';
  if (stockQuantity <= reorderPoint) return 'low-stock';
  return 'in-stock';
};

const normalizeProductInventory = (product: Product): Product => {
  const stockQuantity = inferStockQuantity(product);
  const reorderPoint = inferReorderPoint(product);
  return {
    ...product,
    stockQuantity,
    reorderPoint,
    stockStatus: deriveStockStatus(stockQuantity, reorderPoint),
  };
};

// Async error wrapper
const asyncHandler =
  (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/',
  asyncHandler((req, res) => {
    try {
      const products = db.products;
      if (!products || !Array.isArray(products)) {
        console.error('Products data is invalid or missing');
        return res.status(500).json({ message: 'Unable to load products', products: [] });
      }
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products', products: [] });
    }
  })
);

router.get(
  '/admin/inventory',
  requireAuth,
  requireAdmin,
  asyncHandler((req, res) => {
    const inventory = db.products.map((product) => normalizeProductInventory(product));
    return res.json(inventory);
  })
);

router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler((req, res) => {
    const parseResult = adminProductCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Invalid product payload',
        details: parseResult.error.errors.map((error) => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      });
    }

    const payload = parseResult.data;
    const nextId =
      db.products.reduce((maxId, product) => Math.max(maxId, Number(product.id) || 0), 0) + 1;

    const stockStatus = deriveStockStatus(payload.stockQuantity, payload.reorderPoint);

    const newProduct: Product = {
      id: nextId,
      name: payload.name.trim(),
      category: payload.category,
      price: payload.price,
      imageUrl: payload.imageUrl,
      description: payload.description.trim(),
      weight: payload.weight.trim(),
      brandId: payload.brandId,
      rating: 0,
      reviews: [],
      stockQuantity: payload.stockQuantity,
      reorderPoint: payload.reorderPoint,
      stockStatus,
    };

    db.products.push(newProduct);
    db.write();

    return res.status(201).json(newProduct);
  })
);

router.patch(
  '/:id/inventory',
  requireAuth,
  requireAdmin,
  asyncHandler((req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const parseResult = inventoryUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Invalid inventory payload',
        details: parseResult.error.errors.map((error) => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      });
    }

    const productIndex = db.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { stockQuantity, reorderPoint } = parseResult.data;
    const stockStatus = deriveStockStatus(stockQuantity, reorderPoint);

    const updatedProduct: Product = {
      ...db.products[productIndex],
      stockQuantity,
      reorderPoint,
      stockStatus,
    };

    db.products[productIndex] = updatedProduct;
    db.write();

    return res.json(updatedProduct);
  })
);

router.get(
  '/:id',
  asyncHandler((req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      const product = db.products.find((p) => p.id === id);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  })
);

router.get(
  '/:id/bundles',
  optionalAuth,
  asyncHandler((req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const baseProduct = db.products.find((p) => p.id === id);
    if (!baseProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const relatedCategories = complementaryCategories[baseProduct.category] || ['Accessories'];
    const candidates = db.products
      .filter(
        (product) =>
          product.id !== baseProduct.id &&
          product.stockStatus !== 'out-of-stock' &&
          (relatedCategories.includes(product.category) || product.brandId === baseProduct.brandId)
      )
      .sort((a, b) => {
        const brandBoostA = a.brandId === baseProduct.brandId ? 0.25 : 0;
        const brandBoostB = b.brandId === baseProduct.brandId ? 0.25 : 0;
        return b.rating + brandBoostB - (a.rating + brandBoostA);
      })
      .slice(0, 3);

    if (candidates.length === 0) {
      return res.json({
        title: 'Bundle & Save',
        baseProductId: baseProduct.id,
        items: [],
        discountPercent: 0,
        originalTotal: baseProduct.price,
        bundleTotal: baseProduct.price,
      });
    }

    const discountPercent = candidates.length >= 3 ? 8 : 5;
    const originalTotal = [baseProduct, ...candidates].reduce((sum, item) => sum + item.price, 0);
    const bundleTotal = Math.max(
      0,
      Number((originalTotal * (1 - discountPercent / 100)).toFixed(2))
    );

    return res.json({
      title: 'Bundle & Save',
      baseProductId: baseProduct.id,
      items: candidates,
      discountPercent,
      originalTotal,
      bundleTotal,
    });
  })
);

router.post(
  '/:id/reviews',
  requireAuth,
  asyncHandler((req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const parseResult = reviewCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Invalid review data',
        details: parseResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const productIndex = db.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const requesterId = Number(req.user.id);
    const user = db.users.find((dbUser) => Number(dbUser.id) === requesterId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const hasPurchased = (user.orderHistory || []).some((order) => {
      const status = order.status;
      if (status === 'cancelled' || status === 'refunded') {
        return false;
      }
      return order.items.some((item) => item.id === id);
    });

    const { rating, comment } = parseResult.data;
    const newReview = {
      id: Date.now(),
      author: user.name,
      rating,
      comment,
      date: new Date().toISOString(),
      verifiedPurchase: hasPurchased,
    };

    const product = db.products[productIndex];
    const reviews = [newReview, ...(product.reviews || [])];
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    db.products[productIndex] = {
      ...product,
      reviews,
      rating: Number(averageRating.toFixed(2)),
    };

    db.write();

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview,
      rating: db.products[productIndex].rating,
    });
  })
);

export default router;
