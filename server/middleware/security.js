import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const configureSecurity = (app) => {
  // Helmet helps secure Express apps by setting various HTTP headers
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
};

// Rate limiter for authentication attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
