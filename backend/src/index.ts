import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './controllers/authController';
import resourceRoutes from './controllers/resourceController';
import tagRoutes from './controllers/tagController';
import reportRoutes from './controllers/reportController';
import alertRoutes from './controllers/alertController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT.toString(),
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT.toString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/resources', authMiddleware, resourceRoutes);
app.use('/api/tags', authMiddleware, tagRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendBuildPath));

  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes that failed
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: { message: 'API endpoint not found' } });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});