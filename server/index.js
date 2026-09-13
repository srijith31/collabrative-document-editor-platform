import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { seedTemplates } from './config/seedTemplates.js';
import { configureSecurity } from './middleware/security.js';
import { errorHandler } from './middleware/error.js';
import { initSocketService } from './sockets/socketService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Load server environment variables
dotenv.config();

// Connect database
connectDB().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    seedTemplates();
  }
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map(u => u.trim().replace(/\/+$/, ''))
        .filter(Boolean);

      if (
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.startsWith('http://localhost:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Configure security middleware (Helmet, CORS)
configureSecurity(app);

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running and healthy' });
});

// Root fallback route for unhandled endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Sockets Service
initSocketService(io);

const PORT = process.env.PORT || 5000;
// Only start listening if not running in a test environment
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app, httpServer };
