import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import productRoutes from './routes/productRoutes';
import articleRoutes from './routes/articleRoutes';
import vetRoutes from './routes/vetRoutes';
import animalRoutes from './routes/animalRoutes';
import brandRoutes from './routes/brandRoutes';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import petRoutes from './routes/petRoutes';
import reminderRoutes from './routes/reminderRoutes';
import orderRoutes from './routes/orderRoutes';
import aiRoutes from './routes/aiRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import moderationRoutes from './routes/moderationRoutes';
import adminRoutes from './routes/adminRoutes';
import { requestLogger, errorLogger } from './middleware/logger';
import { securityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { botProtection, honeypotValidation, getCSRFTokenHandler } from './middleware/botProtection';
import { recaptchaMiddleware, getMathChallengeHandler } from './middleware/recaptcha';
import { db } from './db';
import crypto from 'crypto';

dotenv.config();

// Validate critical components before starting
console.log('Backend API initializing...');
const dbStatus = db.getStatus();
if (!dbStatus.loaded) {
  console.error('WARNING: Database had issues loading:', dbStatus.error);
} else {
  console.log(`Database loaded successfully from: ${dbStatus.path}`);
}

const app = express();
const port = process.env.PORT || 5000;

// Request correlation ID middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  (req as any).reqId = reqId;
  res.setHeader('X-Request-Id', reqId as string);
  next();
});

// Needed for accurate client IPs/rate-limiting behind proxies (Vercel, Nginx, etc.)
app.set('trust proxy', 1);

// Compression middleware - should be early for performance
app.use(
  compression({
    filter: (req: express.Request, res: express.Response) => {
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
          'https://www.googletagmanager.com',
          'https://apis.google.com',
          'https://www.google.com/recaptcha/',
          'https://www.gstatic.com/recaptcha/',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://www.petbhai.com',
          'https://petbhai.vercel.app',
          'https://esm.sh',
          'https://api.petbhai.com',
          'https://*.google-analytics.com',
          'https://www.google.com/recaptcha/',
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://www.googleapis.com',
          'https://accounts.google.com',
          'https://firebase.googleapis.com',
          'https://firebaseinstallations.googleapis.com',
          'https://firebaselogging-pa.googleapis.com',
        ],
        frameSrc: [
          'https://www.google.com/recaptcha/',
          'https://recaptcha.google.com/recaptcha/',
          'https://accounts.google.com',
          'https://*.firebaseapp.com',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    // 'unsafe-none' allows Firebase signInWithPopup to communicate with the opener
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
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
const allowedOrigins = [
  'http://localhost:3000',
  'https://myselfrezaul7.github.io',
  'https://www.petbhai.com',
  'https://petbhai.com',
  'https://petbhai.vercel.app',
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(
    ...process.env.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Session-Id',
      'X-CSRF-Token',
      'X-Recaptcha-Token',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: XSS protection
app.use(securityMiddleware);

// Bot protection middleware
app.use(botProtection);

// Global rate limiting
app.use('/api/', apiLimiter);

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFTokenHandler);

// Server-side math captcha challenge endpoint
app.get('/api/captcha/math-challenge', getMathChallengeHandler);

// Honeypot validation for form submissions (POST only)
app.post('/api/auth/login', honeypotValidation);
app.post('/api/auth/signup', honeypotValidation);
app.post('/api/auth/register', honeypotValidation);
app.post('/api/orders', honeypotValidation);

// reCAPTCHA verification for sensitive endpoints
// Applied to login, signup, and order creation
app.post('/api/auth/login', recaptchaMiddleware);
app.post('/api/auth/signup', recaptchaMiddleware);
app.post('/api/auth/register', recaptchaMiddleware);
app.post('/api/orders', recaptchaMiddleware);

// Public GET data cache middleware
const publicCache = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.method === 'GET') {
    // Cache for 5 minutes (300 seconds), allow stale-while-revalidate for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  }
  next();
};

// Routes
app.use('/api/products', publicCache, productRoutes);
app.use('/api/articles', publicCache, articleRoutes);
app.use('/api/vets', publicCache, vetRoutes);
app.use('/api/animals', publicCache, animalRoutes);
app.use('/api/brands', publicCache, brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', profileRoutes);
app.use('/api/auth', petRoutes);
app.use('/api/auth', reminderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', moderationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/admin', adminRoutes);

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = db.getStatus();
  const memUsage = process.memoryUsage();
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.json({
    status: dbStatus.loaded ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    ...(isDevelopment && {
      environment: process.env.NODE_ENV || 'development',
      database: {
        loaded: dbStatus.loaded,
        path: dbStatus.path,
        error: dbStatus.error,
        productCount: db.products?.length || 0,
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
    }),
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found', path: req.path });
});

// Catch-all 404 handler for any remaining unhandled routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found', path: req.path });
});

// Error logging middleware
app.use(errorLogger);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err.stack);

  const statusCode = Number(err?.status) || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  // In production, keep server errors generic but allow explicit client-error messages.
  let message =
    process.env.NODE_ENV === 'production'
      ? isClientError
        ? err?.message || 'Request failed'
        : 'Internal Server Error'
      : err?.message || 'Internal Server Error';

  if (err?.name === 'PersistenceError') {
    message = err.message || 'Database persistence failed';
  }

  // Request correlation ID (set by request logger or custom middleware)
  const reqId = (req as any).reqId || 'unknown';

  res.status(statusCode).json({
    error: isClientError ? 'Client Error' : 'Server Error',
    message,
    reqId,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
});

// Start server only if not running in Vercel (Vercel handles starting the server logic)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const startServer = (attemptPort: number, maxRetries = 3): void => {
    const server = app
      .listen(attemptPort)
      .on('listening', () => {
        console.log(`\n🚀 Server is running on port ${attemptPort}`);
        console.log(`   Health check: http://localhost:${attemptPort}/api/health`);
        console.log(`   Products API: http://localhost:${attemptPort}/api/products\n`);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️  Port ${attemptPort} is in use.`);
          if (maxRetries > 0) {
            const newPort = attemptPort + 1;
            console.log(`   Trying port ${newPort}...`);
            startServer(newPort, maxRetries - 1);
          } else {
            console.error(
              '❌ Could not find an available port. Please close other applications or specify a different port.'
            );
            process.exit(1);
          }
        } else {
          console.error('❌ Server error:', err);
          process.exit(1);
        }
      });

    // Graceful shutdown with timeout
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      // Force exit after 10 seconds if graceful shutdown fails
      const forceExitTimeout = setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);

      server.close(() => {
        clearTimeout(forceExitTimeout);
        console.log('Server closed. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  };

  // Global error handlers - prevent crashes
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    // In development, try to keep running for debugging
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    // Don't crash - log and continue
  });

  // Start the server
  startServer(Number(port));
}

export default app;
