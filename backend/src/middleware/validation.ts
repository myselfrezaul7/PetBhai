import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Generic validation middleware factory
export const validate = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Query validation middleware
export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Params validation middleware
export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid URL parameters',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  // ID parameter
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),

  // Pagination query
  pagination: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
  }),

  // Product filters
  productFilters: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().regex(/^\d+$/).optional(),
    maxPrice: z.string().regex(/^\d+$/).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    sort: z.enum(['price-asc', 'price-desc', 'rating', 'newest', 'default']).optional(),
    q: z.string().optional(),
  }),

  // Login schema
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  // Registration schema
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  // Order creation schema
  createOrder: z.object({
    items: z.array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
      })
    ),
    shippingAddress: z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
      address: z.string().min(5),
      city: z.string().min(2),
      district: z.string().min(2),
      postalCode: z.string().optional(),
    }),
    paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'card', 'bank']),
    notes: z.string().optional(),
  }),

  // Review schema
  createReview: z.object({
    productId: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10, 'Review must be at least 10 characters'),
  }),

  // Contact form schema
  contactForm: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(5),
    message: z.string().min(20),
  }),

  // Adoption application schema
  adoptionApplication: z.object({
    animalId: z.number(),
    applicantInfo: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10),
      address: z.string().min(10),
      occupation: z.string(),
    }),
    housingInfo: z.object({
      type: z.enum(['house', 'apartment', 'other']),
      ownOrRent: z.enum(['own', 'rent']),
      hasYard: z.boolean(),
      landlordApproval: z.boolean().optional(),
    }),
    petExperience: z.string().min(20),
    reasonForAdoption: z.string().min(20),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms',
    }),
  }),

  // Vet booking schema
  vetBooking: z.object({
    vetId: z.number(),
    serviceId: z.string(),
    date: z.string(),
    time: z.string(),
    petInfo: z.object({
      name: z.string(),
      species: z.string(),
      breed: z.string().optional(),
      age: z.string(),
      weight: z.string().optional(),
    }),
    reason: z.string().min(10),
    contactNumber: z.string().min(10),
  }),
};
