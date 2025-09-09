// Minimal server for Railway health checks
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003').split(',').map((s) => s.trim());

// Basic middleware
app.use(helmet());
app.use(cors({ 
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Simple health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

let dbReady = false;

// Auth helper functions
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

// Inline auth routes to avoid module loading issues
app.post('/api/auth/register', async (req, res): Promise<void> => {
  if (!dbReady) {
    res.status(503).json({ error: 'Database not ready, please try again in a moment' });
    return;
  }

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { email, username, firstName, lastName, password } = req.body;

    if (!email || !username || !firstName || !lastName || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

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

    const token = generateToken(user.id);

    res.status(201).json({
      user,
      token,
      message: 'User registered successfully'
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  
  // After server is running, initialize the database
  setTimeout(async () => {
    console.log('Initializing database...');
    try {
      // Run migrations first
      const { exec } = require('child_process');
      exec('npx prisma migrate deploy', (error: any, stdout: any) => {
        if (error) {
          console.error('Migration error:', error);
        } else {
          console.log('Migrations completed:', stdout);
          dbReady = true;
          console.log('Database ready for connections');
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }, 3000); // Give 3 seconds for health checks to pass first
});