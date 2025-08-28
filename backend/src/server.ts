import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Import middleware
import { corsOptions, limiter } from './middleware/security';

// Import routes
import routes from './routes';

// Import services
import cronService from './services/cronService';

// Load environment variables
dotenv.config();

const app = express();
const PORT: number = parseInt(process.env['PORT'] || '3000');

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

// Apply middleware
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());

// Mount API routes
app.use('/api', routes);

// Initialize cron service
cronService.initialize();

// Start server
app.listen(PORT, () => {
  console.info(`🚀 Server running on http://localhost:${PORT}`);
  console.info(`🔒 CORS enabled - Allowed origin: ${process.env['FRONTEND_ORIGIN'] || 'http://localhost:4200'}`);
  console.info(`⏱️  Rate limiting: ${process.env['RATE_LIMIT_MAX_REQUESTS'] || 100} requests per ${Math.ceil((parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000 / 60))} minutes`);
  console.info(`🔄 Cron job active: Tasks will reset every 20 minutes`);
  console.info(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
});
