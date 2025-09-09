import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup from env (supports multiple, comma-separated origins)
const envOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

const vercelRegex = /^https:\/\/([a-z0-9-]+)\.vercel\.app$/i;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (vercelRegex.test(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for origin: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Explicitly handle preflight
app.options('*', cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('Running test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Test query result:', result);
    
    await prisma.$disconnect();
    console.log('Database test successful');
    
    res.json({ 
      message: 'Database connection successful!', 
      result 
    });
  } catch (error: any) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      error: 'Database test failed', 
      message: error?.message 
    });
  }
});

// Debug: check Role enum state and defaults (safe to remove after fix)
app.get('/api/debug/role-enum', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const enumValues = await prisma.$queryRawUnsafe(
      `SELECT enumlabel as value FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'Role' ORDER BY enumsortorder`
    );
    const defaultRow = await prisma.$queryRawUnsafe(
      `SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role'`
    );
    await prisma.$disconnect();
    res.json({ enum: enumValues, default: defaultRow });
  } catch (e: any) {
    res.status(500).json({ error: 'enum check failed', message: e?.message || 'unknown' });
  }
});

// Auth helpers
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

// Registration endpoint
app.post('/api/auth/register', async (req, res): Promise<void> => {
  try {
    console.log('=== REGISTRATION START ===');
    console.log('Body:', req.body);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const { email, username, firstName, lastName, password } = req.body;

    // Validation
    if (!email || !username || !firstName || !lastName || !password) {
      console.log('Validation failed: missing fields');
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    console.log('Validation passed, connecting to database...');

    // Database operations
    const { PrismaClient } = require('@prisma/client');
    console.log('PrismaClient imported');
    
    const prisma = new PrismaClient();
    console.log('PrismaClient instantiated');

    // Check for existing user
    console.log('Checking for existing user...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });
    console.log('Existing user check completed, found:', !!existingUser);

    if (existingUser) {
      console.log('User already exists, returning error');
      await prisma.$disconnect();
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    // Create user
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed, creating user...');
    
    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    console.log('User created in database, generating token...');
    const token = generateToken(user.id);
    console.log('Token generated, disconnecting from database...');
    
    await prisma.$disconnect();
    console.log('Database disconnected');

    console.log('Registration successful for user:', user.id);
    
    res.status(201).json({
      user,
      token,
      message: 'User registered successfully'
    });

  } catch (error: any) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Full error:', error);
    console.error('Stack trace:', error?.stack);
    // Attempt to surface common failure reasons
    if (typeof error?.message === 'string') {
      if (error.message.includes('Unique constraint failed') || error.message.includes('already exists')) {
        res.status(400).json({ error: 'User with this email or username already exists' });
        return;
      }
      if (error.message.includes('JWT') || error.message.includes('secret') || error.message.includes('invalid signature')) {
        res.status(500).json({ error: 'JWT configuration error' });
        return;
      }
      if (error.message.includes('Enum') || error.message.includes('enum') || error.message.includes('invalid input value for enum')) {
        res.status(500).json({ error: 'Database enum mismatch (Role). Please ensure migrations are applied.' });
        return;
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Fresh server running on port ${PORT}`);
  console.log('Environment variables:');
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  // Run migrations after server is healthy
  setTimeout(() => {
    console.log('Running database migrations...');
    const { exec } = require('child_process');
    exec('npx prisma migrate deploy || npx prisma db push', (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error('Migration command failed:', error?.message || error);
        if (stderr) console.error('stderr:', stderr);
      } else {
        console.log('Database migrations completed successfully or schema pushed');
      }
      if (stdout) console.log(stdout);
      console.log('Server is ready for registration requests');
    });
  }, 5000); // Wait 5 seconds for health checks to pass first
});
