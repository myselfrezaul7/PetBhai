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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

console.log('Backend API initializing...');

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for now to allow images/scripts from various sources
  })
);
app.use(cors());
app.use(express.json());

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server only if not running in Vercel (Vercel handles starting the server logic)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
