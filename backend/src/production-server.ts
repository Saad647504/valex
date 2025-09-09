import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5001;

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://valex-frontend.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Health check - must be first
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Lazy load routes after server starts
let routesLoaded = false;

const loadRoutes = async () => {
  if (routesLoaded) return;
  
  try {
    console.log('Loading routes...');
    
    // Import routes dynamically to avoid startup issues
    const authRoutes = await import('./routes/auth');
    const projectRoutes = await import('./routes/projects');
    const taskRoutes = await import('./routes/tasks');
    const healthRoutes = await import('./routes/health');
    const userRoutes = await import('./routes/users');
    
    // Mount core routes
    app.use('/api/auth', authRoutes.default);
    app.use('/api/projects', projectRoutes.default);
    app.use('/api/tasks', taskRoutes.default);
    app.use('/api', healthRoutes.default);
    app.use('/api/users', userRoutes.default);
    
    // Try to load optional routes
    try {
      const aiRoutes = await import('./routes/ai');
      app.use('/api/ai', aiRoutes.default);
    } catch (e) {
      console.warn('AI routes not loaded:', e);
    }
    
    try {
      const githubRoutes = await import('./routes/github');
      app.use('/api/github', githubRoutes.default);
    } catch (e) {
      console.warn('GitHub routes not loaded:', e);
    }
    
    try {
      const sessionRoutes = await import('./routes/sessions');
      app.use('/api/sessions', sessionRoutes.default);
    } catch (e) {
      console.warn('Session routes not loaded:', e);
    }
    
    try {
      const teamRoutes = await import('./routes/team');
      app.use('/api/team', teamRoutes.default);
    } catch (e) {
      console.warn('Team routes not loaded:', e);
    }
    
    try {
      const notesRoutes = await import('./routes/notes');
      app.use('/api/notes', notesRoutes.default);
    } catch (e) {
      console.warn('Notes routes not loaded:', e);
    }
    
    try {
      const notificationsRoutes = await import('./routes/notifications');
      app.use('/api/notifications', notificationsRoutes.default);
    } catch (e) {
      console.warn('Notifications routes not loaded:', e);
    }
    
    routesLoaded = true;
    console.log('Routes loaded successfully');
    
  } catch (error) {
    console.error('Error loading routes:', error);
  }
};

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Catch-all for routes that need to be loaded
app.use('/api/*', async (req, res, next) => {
  if (!routesLoaded) {
    await loadRoutes();
  }
  next();
});

// Start server
server.listen(PORT, async () => {
  console.log(`Production server running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- DATABASE_URL:', !!process.env.DATABASE_URL);
  console.log('- JWT_SECRET:', !!process.env.JWT_SECRET);
  console.log('- OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY);
  
  // Load routes after server is listening
  setTimeout(loadRoutes, 2000);
});