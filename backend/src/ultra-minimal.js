const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
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
});