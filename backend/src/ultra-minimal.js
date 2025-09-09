const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

// Temporary hardcoded env vars for Railway debugging
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres.tlkwyhbbunlhdhyqadmt:Saadbachaoui6475@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';
  process.env.JWT_SECRET = 'railway-valex-jwt-secret-2024-super-secure-key-abc123';
  process.env.NODE_ENV = 'production';
  console.log('Using hardcoded environment variables with Supabase Transaction pooler');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://valex-delta.vercel.app',
  'https://valex-frontend.vercel.app'
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});

app.get('/health', (req, res) => {
  console.log('Health check requested');
  try {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Server is running', health: '/health', register: '/api/auth/register' });
});

// Basic projects endpoint
app.get('/api/projects', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // For now, return empty array since we need auth middleware
    const projects = [];
    
    await prisma.$disconnect();
    res.json(projects);
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Current user endpoint - critical for app startup
app.get('/api/users/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const { PrismaClient } = require('@prisma/client');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (!user) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'User not found' });
    }
    
    await prisma.$disconnect();
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Notifications endpoint
app.get('/api/notifications', async (req, res) => {
  try {
    // Return empty array for now
    res.json([]);
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Analytics endpoints
app.get('/api/analytics/user/:userId', async (req, res) => {
  try {
    // Return empty analytics
    res.json({
      totalTasks: 0,
      completedTasks: 0,
      totalTimeSpent: 0,
      productivity: 0,
      recentActivity: []
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { PrismaClient } = require('@prisma/client');
    
    const { email, username, firstName, lastName, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const prisma = new PrismaClient();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        firstName: firstName || 'User',
        lastName: lastName || 'Name',
        password: hashedPassword
      }
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret');
    await prisma.$disconnect();
    
    res.json({ 
      message: 'Registration successful', 
      user: { 
        id: user.id, 
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error?.message || 'Unknown error'
    });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  console.log(`Ultra minimal server listening on port ${PORT}`);
  console.log('Server address:', address);
  console.log('Server ready to accept requests on all interfaces (0.0.0.0)');
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', PORT);
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  // Test database connection and run migrations
  if (process.env.DATABASE_URL) {
    console.log('Testing database connection...');
    setTimeout(async () => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1 as test`;
        console.log('Database connection successful!');
        await prisma.$disconnect();
        
        // Now run migrations
        console.log('Running database migrations...');
        const { exec } = require('child_process');
        exec('npx prisma migrate deploy && npx prisma generate', (error, stdout, stderr) => {
          if (error) {
            console.error('Migration error:', error);
            console.log('Server will continue without migrations - registration may fail');
          } else {
            console.log('Migrations completed successfully');
            console.log(stdout);
          }
        });
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        console.log('Server will continue without database - registration will fail');
      }
    }, 2000);
  }
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});