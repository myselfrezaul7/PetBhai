import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import compression from 'compression';
import productRoutes from './routes/productRoutes';
import articleRoutes from './routes/articleRoutes';
import vetRoutes from './routes/vetRoutes';
import animalRoutes from './routes/animalRoutes';
import brandRoutes from './routes/brandRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import aiRoutes from './routes/aiRoutes';
import postRoutes from './routes/postRoutes';
import { requestLogger, errorLogger } from './middleware/logger';
import { securityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { botProtection, honeypotValidation, getCSRFTokenHandler } from './middleware/botProtection';
import { recaptchaMiddleware } from './middleware/recaptcha';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

console.log('Backend API initializing...');

// Compression middleware - should be early for performance
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between compression ratio and speed
  })
);

// Security middleware - should be first
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://esm.sh',
          'https://cdn.tailwindcss.com',
          'https://www.google.com/recaptcha/',
          'https://www.gstatic.com/recaptcha/',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://esm.sh',
          'https://api.petbhai.com',
          'https://www.google.com/recaptcha/',
        ],
        frameSrc: ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    originAgentCluster: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })
);

// Additional security headers not covered by helmet
app.use((req, res, next) => {
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  // Additional XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent caching of sensitive data
  if (req.path.includes('/api/auth') || req.path.includes('/api/orders')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'https://myselfrezaul7.github.io'];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: XSS and SQL injection protection
app.use(securityMiddleware);

// Bot protection middleware
app.use(botProtection);

// Global rate limiting
app.use('/api/', apiLimiter);

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFTokenHandler);

// Honeypot validation for form submissions
app.use('/api/auth', honeypotValidation);
app.use('/api/orders', honeypotValidation);

// reCAPTCHA verification for sensitive endpoints
// Applied to login, signup, and order creation
app.post('/api/auth/login', recaptchaMiddleware);
app.post('/api/auth/signup', recaptchaMiddleware);
app.post('/api/auth/register', recaptchaMiddleware);
app.post('/api/orders', recaptchaMiddleware);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve static files from the React frontend app
// const frontendDistPath = path.join(__dirname, '../../dist');
// app.use(express.static(frontendDistPath));

// Anything that doesn't match the above, send back index.html
// app.get('*', (req, res) => {
//   if (req.path.startsWith('/api')) {
//     // If it's an API route that wasn't found, return 404 JSON
//     return res.status(404).json({ message: 'API endpoint not found' });
//   }
//   res.sendFile(path.join(frontendDistPath, 'index.html'));
// });

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found', path: req.path });
});

// Error logging middleware
app.use(errorLogger);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack);

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  res.status(err.status || 500).json({
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

// Start server only if not running in Vercel (Vercel handles starting the server logic)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Persist any critical state if possible
    process.exit(1); // Exit to allow process manager (PM2) to restart us
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit immediately, but log it. In future Node versions this might crash.
  });
}

export default app;
