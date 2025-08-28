import { CorsOptions } from 'cors';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

// CORS Configuration - Whitelist only frontend origin in production
const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    const allowedOrigin = process.env['FRONTEND_ORIGIN'] || 'http://localhost:4200';

    // In development, allow all origins
    if (!isProduction) {
      return callback(null, true);
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (origin === allowedOrigin) {
      callback(null, true);
    } else {
      console.info(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting configuration
const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: process.env['RATE_LIMIT_MESSAGE'] || 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.info(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: process.env['RATE_LIMIT_MESSAGE'] || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000 / 60) // minutes
    });
  }
});

export {
  corsOptions,
  limiter
};
