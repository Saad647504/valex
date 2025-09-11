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

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'valex-backend'
  });
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
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { projectKey } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        key: projectKey.toUpperCase(),
        OR: [
          { ownerId: userId },
          { 
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
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
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project by key error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { name, description, key, color } = req.body;

    if (!name || !key) {
      return res.status(400).json({ error: 'Name and key are required' });
    }

    // Check if project key already exists
    const existingProject = await prisma.project.findUnique({
      where: { key }
    });

    if (existingProject) {
      return res.status(400).json({ error: 'Project key already exists' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        key: key.toUpperCase(),
        color: color || '#3B82F6',
        ownerId: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create default columns
    await prisma.column.createMany({
      data: [
        {
          name: 'To Do',
          position: 1,
          color: '#64748B',
          projectId: project.id
        },
        {
          name: 'In Progress',
          position: 2,
          color: '#F59E0B',
          projectId: project.id
        },
        {
          name: 'Done',
          position: 3,
          color: '#10B981',
          isDefault: true,
          projectId: project.id
        }
      ]
    });

    res.status(201).json({ project, message: 'Project created successfully' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { projectId } = req.params;

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Delete project and all related data (cascade)
    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { projectId } = req.params;
    const { name, description, key } = req.body;

    // Check if user owns the project
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Check if key is unique (if provided and different)
    if (key && key !== existingProject.key) {
      const keyExists = await prisma.project.findFirst({
        where: { 
          key,
          id: { not: projectId }
        }
      });
      
      if (keyExists) {
        return res.status(400).json({ error: 'Project key already exists' });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(key && { key })
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        columns: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.json({ project: updatedProject, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// AI endpoints
app.get('/api/ai/insights', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get user's tasks for analysis
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId }
        ]
      },
      include: {
        project: { select: { name: true } }
      }
    });

    const completedTasks = tasks.filter(t => t.status === 'DONE');
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
    
    const insights = [];
    
    // Generate productivity insights
    if (tasks.length > 0) {
      const completionRate = Math.round((completedTasks.length / tasks.length) * 100);
      
      if (completionRate >= 80) {
        insights.push({
          type: 'success',
          message: `🎯 Excellent! You've completed ${completionRate}% of your tasks - you're crushing your goals!`,
          action: 'keep_going'
        });
      } else if (completionRate >= 60) {
        insights.push({
          type: 'success', 
          message: `👍 You've completed ${completionRate}% of your tasks - great progress!`,
          action: 'maintain_pace'
        });
      } else if (completionRate < 40) {
        insights.push({
          type: 'warning',
          message: `🎯 You've completed ${completionRate}% of your tasks - consider focusing on fewer tasks to increase completion rate.`,
          action: 'focus_more'
        });
      }
      
      if (inProgressTasks.length > 5) {
        insights.push({
          type: 'warning',
          message: `🔄 You have ${inProgressTasks.length} tasks in progress - consider focusing on fewer tasks at once.`,
          action: 'reduce_wip'
        });
      }
    } else {
      insights.push({
        type: 'info',
        message: '👋 Welcome! Start by creating your first task to see personalized insights.',
        action: 'create_task'
      });
    }

    res.json({ insights });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId }
        ]
      },
      include: {
        project: { select: { name: true } }
      }
    });

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { name: true, description: true }
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for a task management app called Valex. The user's name is ${user?.firstName || 'User'}. They have ${tasks.length} tasks and ${projects.length} projects. Be helpful, concise, and focus on productivity and task management. Keep responses under 150 words.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    res.json({ 
      message: aiMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI chat failed' });
  }
});

app.post('/api/ai/suggest-tasks', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { projectId, context } = req.body;

    // Get user's existing tasks and project context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId }
        ],
        ...(projectId && { projectId })
      },
      include: {
        project: { select: { name: true, description: true } }
      }
    });

    const project = projectId ? await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true }
    }) : null;

    // Build context for AI
    const taskContext = tasks.map(task => 
      `${task.title} (${task.status}) - ${task.description || 'No description'}`
    ).join('\n');

    const prompt = `Based on the following project and tasks, suggest 5 specific, actionable tasks that would help move the project forward:

Project: ${project?.name || 'General tasks'}
Description: ${project?.description || 'No project description'}
Context: ${context || 'No additional context'}

Current tasks:
${taskContext || 'No existing tasks'}

Generate 5 task suggestions that are:
1. Specific and actionable
2. Relevant to the project context
3. Not duplicating existing tasks
4. Varied in scope (mix of quick wins and bigger items)

Format as a simple list.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // Parse the response into individual suggestions
    const suggestions = aiResponse
      .split('\n')
      .filter(line => line.trim() && (line.includes('.') || line.includes('-')))
      .map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim())
      .filter(suggestion => suggestion.length > 10)
      .slice(0, 5);

    // Fallback suggestions if AI fails
    if (suggestions.length === 0) {
      const fallbackSuggestions = [
        "Add password reset functionality",
        "Create project search and filtering", 
        "Set up automated testing pipeline",
        "Implement real-time notifications",
        "Add task priority system"
      ];
      res.json({ suggestions: fallbackSuggestions });
    } else {
      res.json({ suggestions });
    }
  } catch (error) {
    console.error('AI suggest tasks error:', error);
    res.status(500).json({ error: 'Failed to generate task suggestions' });
  }
});

// Session endpoints
app.get('/api/sessions/active', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const session = await prisma.focusSession.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            key: true
          }
        }
      }
    });

    res.json({ session });
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
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { duration, projectId, taskId, sessionType = 'FOCUS' } = req.body;

    if (!duration) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    // End any active sessions first
    await prisma.focusSession.updateMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'INTERRUPTED',
        endedAt: new Date()
      }
    });

    const session = await prisma.focusSession.create({
      data: {
        userId,
        projectId,
        taskId,
        duration,
        sessionType,
        status: 'ACTIVE',
        startedAt: new Date()
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            key: true
          }
        }
      }
    });

    res.status(201).json({
      session,
      message: 'Focus session started'
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/sessions/:id/complete', async (req, res) => {
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
    const { actualDuration, notes } = req.body;

    const session = await prisma.focusSession.findFirst({
      where: {
        id,
        userId,
        status: 'ACTIVE'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const updatedSession = await prisma.focusSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        actualDuration: actualDuration || session.duration,
        notes
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            key: true
          }
        }
      }
    });

    res.json({
      session: updatedSession,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

app.post('/api/sessions/:id/pause', async (req, res) => {
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

    const session = await prisma.focusSession.findFirst({
      where: {
        id,
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const newStatus = session.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    const updatedSession = await prisma.focusSession.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json({
      session: updatedSession,
      message: `Session ${newStatus.toLowerCase()}`
    });

  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

app.get('/api/sessions/stats', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { period = '7d' } = req.query;

    let startDate = new Date();
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate
        },
        status: { in: ['COMPLETED', 'INTERRUPTED'] }
      },
      include: {
        project: {
          select: { name: true, key: true }
        },
        task: {
          select: { title: true, key: true }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    const calculateStreak = async (userId) => {
      try {
        const sessions = await prisma.focusSession.findMany({
          where: {
            userId,
            status: 'COMPLETED'
          },
          orderBy: {
            startedAt: 'desc'
          },
          take: 100
        });

        let streak = 0;
        const today = new Date().toDateString();
        let currentDate = today;
        
        for (const session of sessions) {
          const sessionDate = session.startedAt.toDateString();
          if (sessionDate === currentDate) {
            if (streak === 0) streak = 1;
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            currentDate = prevDate.toDateString();
          } else if (sessionDate === currentDate) {
            streak++;
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            currentDate = prevDate.toDateString();
          } else {
            break;
          }
        }

        return streak;
      } catch (error) {
        console.error('Failed to calculate streak:', error);
        return 0;
      }
    };

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'COMPLETED').length,
      totalFocusTime: sessions.reduce((total, session) => 
        total + (session.actualDuration || session.duration), 0
      ),
      averageSessionLength: sessions.length > 0 
        ? Math.round(sessions.reduce((total, session) => 
            total + (session.actualDuration || session.duration), 0
          ) / sessions.length)
        : 0,
      streak: await calculateStreak(userId),
      sessionsToday: sessions.filter(s => 
        s.startedAt.toDateString() === new Date().toDateString()
      ).length,
      recentSessions: sessions.slice(0, 10)
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Notes endpoints
app.get('/api/notes', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });
    
    res.json(notes);
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
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { noteId } = req.params;
    
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Update note
app.patch('/api/notes/:noteId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { noteId } = req.params;
    const { title, content, color, isPinned, isStarred, tags } = req.body;
    
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isStarred !== undefined && { isStarred }),
        ...(tags !== undefined && { tags })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    });
    
    res.json({ note, message: 'Note updated successfully' });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { noteId } = req.params;
    
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await prisma.note.delete({
      where: { id: noteId }
    });
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
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
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim().toLowerCase();

    if (searchTerm.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { isActive: true },
          {
            OR: [
              { username: { contains: searchTerm, mode: 'insensitive' } },
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true
      },
      take: 20,
      orderBy: [
        { username: 'asc' }
      ]
    });

    res.json({ users });
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

app.post('/api/team/invite', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { email, projectId, role = 'MEMBER' } = req.body;

    if (!email || !projectId) {
      return res.status(400).json({ error: 'Email and project ID are required' });
    }

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!project) {
      return res.status(403).json({ error: 'Only project owners can invite members' });
    }

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: invitedUser.id
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a project member' });
    }

    // Create project membership
    const membership = await prisma.projectMember.create({
      data: {
        projectId,
        userId: invitedUser.id,
        role
      },
      include: {
        user: {
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
      membership,
      message: 'User added to project successfully' 
    });
  } catch (error) {
    console.error('Team invite error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

app.delete('/api/team/projects/:projectId/members/:userId', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;
    
    const { projectId, userId } = req.params;

    // Check if current user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUserId
      }
    });

    if (!project) {
      return res.status(403).json({ error: 'Only project owners can remove members' });
    }

    // Don't allow removing the owner
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    // Remove the membership
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

app.put('/api/team/projects/:projectId/members/:userId/role', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;
    
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (MEMBER or ADMIN)' });
    }

    // Check if current user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: currentUserId
      }
    });

    if (!project) {
      return res.status(403).json({ error: 'Only project owners can change member roles' });
    }

    // Update the member's role
    const updatedMembership = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      membership: updatedMembership,
      message: 'Member role updated successfully' 
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
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