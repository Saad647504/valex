const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Prisma client
const prisma = new PrismaClient();

console.log('Server starting with Prisma client initialized');

// Environment variables should now be set via Railway dashboard
console.log('Using Railway environment variables');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://valex-delta.vercel.app',
  'https://valex-frontend.vercel.app',
  'https://valex-git-main-saabachaoui-1974s-projects.vercel.app'
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
    const jwt = require('jsonwebtoken');
    
    // Extract token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    // Fetch projects owned by the user
    const projects = await prisma.project.findMany({
      where: {
        ownerId: userId
      },
      include: {
        columns: {
          include: {
            tasks: {
              include: {
                assignee: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        owner: true,
        members: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ projects });
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
    // Return proper analytics structure
    res.json({
      userInfo: {
        name: "User",
        email: "user@example.com", 
        memberSince: new Date().toISOString(),
        totalProjects: 0
      },
      taskMetrics: {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        completionRate: 0,
        averageCompletionTime: 0
      },
      productivityData: [],
      projectContributions: [],
      priorityDistribution: [
        { priority: "LOW", count: 0 },
        { priority: "MEDIUM", count: 0 },
        { priority: "HIGH", count: 0 },
        { priority: "URGENT", count: 0 }
      ],
      dailyActivity: [],
      insights: [
        {
          type: "info",
          message: "Welcome to your analytics dashboard! Start creating projects and tasks to see your productivity insights."
        }
      ]
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// More analytics endpoints
app.get('/api/analytics/project/key/:projectKey', async (req, res) => {
  try {
    res.json({
      totalTasks: 0,
      completedTasks: 0,
      totalTimeSpent: 0,
      productivity: 0,
      recentActivity: []
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch project analytics' });
  }
});

// Search endpoints
app.post('/api/search', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/search/tasks', async (req, res) => {
  try {
    res.json({ tasks: [], total: 0 });
  } catch (error) {
    console.error('Task search error:', error);
    res.status(500).json({ error: 'Task search failed' });
  }
});

// Task endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        column: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { title, description, projectId, columnId, assigneeId, priority, estimatedMinutes } = req.body;
    
    if (!title || !projectId || !columnId) {
      return res.status(400).json({ error: 'Title, projectId, and columnId are required' });
    }
    
    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Generate unique task key
    let taskNumber = 1;
    let taskKey = `${project.key}-${taskNumber}`;
    
    while (await prisma.task.findUnique({ where: { key: taskKey } })) {
      taskNumber++;
      taskKey = `${project.key}-${taskNumber}`;
    }
    
    // Get next position in column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    const position = lastTask ? lastTask.position + 1.0 : 1.0;
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        key: taskKey,
        priority: priority || 'MEDIUM',
        position,
        projectId,
        columnId,
        assigneeId: assigneeId,
        creatorId: userId,
        estimatedMinutes
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({ 
      task, 
      message: 'Task created successfully' 
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { id } = req.params;
    const { title, description, columnId, position, status, priority, assigneeId } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(columnId && { columnId }),
        ...(position !== undefined && { position }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(status === 'DONE' && { completedAt: new Date() })
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({ task, message: 'Task updated successfully' });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project endpoints
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Extract token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { projectId } = req.params;
    
    // Fetch project with full details
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId // Ensure user owns the project
      },
      include: {
        columns: {
          include: {
            tasks: {
              include: {
                assignee: true,
                project: true
              },
              orderBy: {
                position: 'asc'
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        owner: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.get('/api/projects/key/:projectKey', async (req, res) => {
  try {
    res.status(404).json({ error: 'Project not found' });
  } catch (error) {
    console.error('Get project by key error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    // Extract token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Create project key from name
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) || 'PROJ';
    
    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        key,
        color: color || '#3B82F6',
        ownerId: userId,
        columns: {
          create: [
            { name: 'To Do', position: 0, color: '#64748B' },
            { name: 'In Progress', position: 1, color: '#F59E0B' },
            { name: 'Done', position: 2, color: '#10B981' }
          ]
        }
      },
      include: {
        columns: {
          include: {
            tasks: true
          }
        },
        owner: true
      }
    });
    
    res.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// AI endpoints
app.get('/api/ai/insights', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    res.json({ message: 'AI chat not implemented yet' });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI chat failed' });
  }
});

app.post('/api/ai/suggest-tasks', async (req, res) => {
  try {
    // Return sample suggestions for now
    const suggestions = [
      "Implement user authentication with JWT tokens",
      "Add password reset functionality",
      "Create project search and filtering",
      "Set up automated testing pipeline",
      "Implement real-time notifications"
    ];
    res.json({ suggestions });
  } catch (error) {
    console.error('AI suggest tasks error:', error);
    res.status(500).json({ error: 'Failed to generate task suggestions' });
  }
});

// Session endpoints
app.get('/api/sessions/active', async (req, res) => {
  try {
    res.json(null);
  } catch (error) {
    console.error('Active session error:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

app.get('/api/sessions/stats', async (req, res) => {
  try {
    res.json({
      totalSessions: 0,
      totalTime: 0,
      averageSession: 0,
      productivity: 0
    });
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({ error: 'Failed to fetch session stats' });
  }
});

app.post('/api/sessions/start', async (req, res) => {
  try {
    res.json({ message: 'Session start not implemented yet' });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Notes endpoints
app.get('/api/notes', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Extract token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { title, content, color, projectId } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Note title is required' });
    }
    
    const note = await prisma.note.create({
      data: {
        title,
        content: content || '',
        color: color || '#FEF3C7',
        userId,
        projectId: projectId || null
      }
    });
    
    res.json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/api/notes/:noteId', async (req, res) => {
  try {
    res.status(404).json({ error: 'Note not found' });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// GitHub endpoints
app.get('/api/github/status', async (req, res) => {
  try {
    res.json({ connected: false });
  } catch (error) {
    console.error('GitHub status error:', error);
    res.status(500).json({ error: 'Failed to get GitHub status' });
  }
});

// User endpoints
app.get('/api/users/search', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'User search failed' });
  }
});

app.get('/api/users/profile/:username', async (req, res) => {
  try {
    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Team endpoints
app.get('/api/team/invitations/pending', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Pending invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch pending invitations' });
  }
});

app.get('/api/team/colleagues', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Colleagues error:', error);
    res.status(500).json({ error: 'Failed to fetch colleagues' });
  }
});

app.get('/api/team/projects/:projectId/members', async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Project members error:', error);
    res.status(500).json({ error: 'Failed to fetch project members' });
  }
});

app.get('/api/team/projects/:projectId/can-invite/:email', async (req, res) => {
  try {
    res.json({ canInvite: true });
  } catch (error) {
    console.error('Can invite error:', error);
    res.status(500).json({ error: 'Failed to check invite status' });
  }
});

// Notification mark as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Auth me endpoint - another critical missing endpoint
app.get('/api/auth/me', async (req, res) => {
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
    console.error('Get auth me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Login endpoint - CRITICAL MISSING ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { PrismaClient } = require('@prisma/client');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret');
    await prisma.$disconnect();
    
    res.json({
      message: 'Login successful',
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
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error?.message || 'Unknown error'
    });
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