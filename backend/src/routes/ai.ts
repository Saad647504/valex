import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';
import { AIService } from '../services/aiservice';

const router = Router();
const aiService = new AIService();

// All AI routes require authentication
router.use(requireAuth);

// AI Chat endpoint
router.post('/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Use actual OpenAI API
    const response = await aiService.chatWithAI(message, context, req.userId);

    res.json({
      message: response,
      timestamp: new Date(),
      suggestions: [
        "Analyze my current tasks",
        "Show team performance insights", 
        "Suggest task prioritization",
        "Help with sprint planning"
      ]
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    // Fallback responses if OpenAI fails
    const responses = {
      task_analysis: "I can help you analyze tasks and suggest assignments. Share the task details and I'll provide insights on complexity, time estimates, and best team member to assign it to.",
      project_help: "I can assist with project management, task prioritization, team productivity insights, and workflow optimization. What would you like help with?",
      team_performance: "Based on your team's data, I can provide insights on performance trends, productivity patterns, and suggestions for improvement.",
      default: "I'm your AI assistant for project management. I can help with task analysis, team assignments, productivity insights, and project optimization. How can I assist you today?"
    };

    // Simple keyword matching for fallback
    const { message: userMessage } = req.body;
    let fallbackResponse = responses.default;
    if (userMessage.toLowerCase().includes('task')) fallbackResponse = responses.task_analysis;
    if (userMessage.toLowerCase().includes('project')) fallbackResponse = responses.project_help;
    if (userMessage.toLowerCase().includes('team') || userMessage.toLowerCase().includes('performance')) fallbackResponse = responses.team_performance;

    res.json({
      message: fallbackResponse,
      timestamp: new Date(),
      suggestions: [
        "Analyze my current tasks",
        "Show team performance insights",
        "Suggest task prioritization", 
        "Help with sprint planning"
      ]
    });
  }
});

// Task analysis endpoint
router.post('/analyze-task', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, projectId } = req.body;
    
    if (!title || !projectId) {
      res.status(400).json({ error: 'Title and projectId are required' });
      return;
    }

    // Get team members for analysis
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const teamMembers = [
      ...(project.owner ? [project.owner] : []),
      ...project.members.map((m: any) => m.user)
    ];

    const analysis = await aiService.analyzeTask(title, description, teamMembers);
    
    res.json({ analysis });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Task suggestions endpoint
router.post('/suggest-tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectContext } = req.body;
    
    if (!projectContext) {
      res.status(400).json({ error: 'Project context is required' });
      return;
    }

    const suggestions = await aiService.generateTaskSuggestions(projectContext);
    
    res.json({ suggestions });

  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Suggestions failed' });
  }
});

// Get AI-powered insights
router.get('/insights', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Get user's projects and tasks data
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        tasks: {
          include: {
            assignee: { select: { firstName: true, lastName: true } },
            column: true
          }
        },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        owner: { select: { firstName: true, lastName: true } }
      }
    });

    // Pull recent focus session stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'INTERRUPTED'] }
      },
      orderBy: { startedAt: 'desc' }
    });
    const sessionStats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter((s: any) => s.status === 'COMPLETED').length,
      totalFocusTime: sessions.reduce((sum: number, s: any) => sum + (s.actualDuration || s.duration || 0), 0),
      averageSessionLength: sessions.length > 0 ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.actualDuration || s.duration || 0), 0) / sessions.length) : 0,
      sessionsToday: sessions.filter((s: any) => s.startedAt.toDateString() === new Date().toDateString()).length
    };

    // Calculate insights
    const insights = await aiService.generateInsights(projects, userId, sessionStats);
    
    res.json({ insights });

  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Insights failed' });
  }
});

export default router;
