import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import productRoutes from './routes/productRoutes';
import articleRoutes from './routes/articleRoutes';
import vetRoutes from './routes/vetRoutes';
import animalRoutes from './routes/animalRoutes';
import brandRoutes from './routes/brandRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import aiRoutes from './routes/aiRoutes';
import { requestLogger, errorLogger } from './middleware/logger';
import { securityMiddleware } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

console.log('Backend API initializing...');

// Security middleware - should be first
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for now to allow images/scripts from various sources
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
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

// Global rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);

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
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
