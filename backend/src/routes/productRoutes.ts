import express from 'express';
import { db } from '../db';

const router = express.Router();

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

export default router;
