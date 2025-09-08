// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import githubRoutes from './routes/github';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';
import searchRoutes from './routes/search';
import aiRoutes from './routes/ai';
import sessionRoutes from './routes/sessions';
import teamRoutes from './routes/team';
import userRoutes from './routes/users';
import notesRoutes from './routes/notes';
import notificationsRoutes from './routes/notifications';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// Socket.io setup
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003').split(',').map((s) => s.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket event handlers
io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} connected via WebSocket`);

  // Join project room for real-time updates
  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} left project ${projectId}`);
  });

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} disconnected`);
  });
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('combined'));
// Capture raw body for webhook signature verification while still parsing JSON
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    // Store raw body so routes (e.g., GitHub webhooks) can verify signatures
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Test endpoint to verify connection
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Backend connection successful!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/health', healthRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') console.log(`WebSocket server ready for real-time connections`);
});
