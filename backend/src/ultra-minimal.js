const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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
  
  // Run migrations after server starts
  if (process.env.DATABASE_URL) {
    console.log('Running database migrations...');
    const { exec } = require('child_process');
    exec('npx prisma migrate deploy && npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        console.error('Migration error:', error);
      } else {
        console.log('Migrations completed successfully');
        console.log(stdout);
      }
    });
  }
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});