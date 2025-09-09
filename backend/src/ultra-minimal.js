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

app.use(cors({ origin: true, credentials: true }));
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
      user: { id: user.id, email: user.email },
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ultra minimal server on port ${PORT}`);
  console.log('Server ready to accept requests');
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