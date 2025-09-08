import { Router, Response } from 'express';
import { AnalyticsService } from '../services/analyticsservice';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';
import { cacheService } from '../services/cacheservice';

const router = Router();
const analyticsService = new AnalyticsService();

// All analytics routes require authentication
router.use(requireAuth);

// Get comprehensive project analytics
router.get('/project/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;

    // Check cache first
    const cached = await cacheService.getProjectAnalytics(projectId);
    if (cached) {
      res.json(cached);
      return;
    }

    // Verify access
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get fresh data
    const analytics = await analyticsService.getProjectAnalytics(projectId);
    
    // Save to cache
    await cacheService.setProjectAnalytics(projectId, analytics);
    
    res.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
// Get personal user analytics (across all projects)
router.get('/user/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestedUserId = req.params.userId;
    const currentUserId = req.userId!;
    
    // Users can only view their own analytics
    if (requestedUserId !== currentUserId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    console.log('Personal analytics request for user:', currentUserId);

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { firstName: true, lastName: true, email: true, createdAt: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's tasks across all projects they have access to
    const userTasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: currentUserId }, // Tasks assigned to user
          { creatorId: currentUserId },  // Tasks created by user
          { 
            project: {
              OR: [
                { ownerId: currentUserId }, // Projects owned by user
                { members: { some: { userId: currentUserId } } } // Projects user is member of
              ]
            }
          }
        ]
      },
      include: {
        project: { select: { name: true } }
      }
    });

    console.log(`Found ${userTasks.length} tasks for user analytics`);

    // If user has no tasks, provide empty personal analytics
    if (userTasks.length === 0) {
        const emptyPersonalAnalytics = {
          userInfo: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            memberSince: user.createdAt,
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
          priorityDistribution: [],
          dailyActivity: [],
          insights: [
            {
              type: 'info',
              message: `👋 Welcome ${user.firstName}! Start by creating your first task to see your analytics here.`
            },
            {
              type: 'info',
              message: `📊 Your personal productivity insights will appear as you complete tasks and focus sessions.`
            }
          ],
          isDemoData: false,
          isPersonalAnalytics: true
        };
        
        res.json(emptyPersonalAnalytics);
        return;
      }

      // Calculate real personal analytics from userTasks
      const completedTasks = userTasks.filter((t: any) => t.status === 'DONE');
      const inProgressTasks = userTasks.filter((t: any) => t.status === 'IN_PROGRESS');
      const todoTasks = userTasks.filter((t: any) => t.status === 'TODO');
      
      // Get unique projects the user has access to
      const uniqueProjects = new Set(userTasks.map((t: any) => t.project.name));
      
      // Calculate priority distribution from real data
      const priorityDistribution = [
        { priority: 'HIGH', count: userTasks.filter((t: any) => t.priority === 'HIGH').length },
        { priority: 'MEDIUM', count: userTasks.filter((t: any) => t.priority === 'MEDIUM').length },
        { priority: 'LOW', count: userTasks.filter((t: any) => t.priority === 'LOW').length },
        { priority: 'URGENT', count: userTasks.filter((t: any) => t.priority === 'URGENT').length }
      ].filter(p => p.count > 0); // Only show priorities that have tasks

      // Calculate project contributions from real data
      const projectContributions: any[] = [];
      uniqueProjects.forEach((projectName) => {
        const projectTasks = userTasks.filter((t: any) => t.project.name === projectName);
        const projectCompletedTasks = projectTasks.filter((t: any) => t.status === 'DONE');
        if (projectCompletedTasks.length > 0) {
          projectContributions.push({
            projectName,
            tasksCompleted: projectCompletedTasks.length,
            percentage: completedTasks.length > 0 ? Math.round((projectCompletedTasks.length / completedTasks.length) * 100) : 0
          });
        }
      });

      // Get focus sessions for productivity data
      const focusSessions = await prisma.focusSession.findMany({
        where: { userId: currentUserId },
        orderBy: { createdAt: 'desc' },
        take: 50 // Last 50 sessions for analysis
      });

      // Calculate weekly productivity from last 5 weeks
      const productivityData: any[] = [];
      const now = new Date();
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7) - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weekTasks = completedTasks.filter((t: any) => {
          const completedDate = new Date(t.completedAt || t.updatedAt);
          return completedDate >= weekStart && completedDate < weekEnd;
        });
        
        const weekSessions = focusSessions.filter((s: any) => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        });
        
        const totalFocusMinutes = weekSessions.reduce((sum: number, session: any) => 
          sum + Math.round((session.actualDuration || session.duration || 0) / 60), 0);

        productivityData.push({
          week: `Week ${5-i}`,
          tasksCompleted: weekTasks.length,
          focusHours: Math.round(totalFocusMinutes / 60 * 10) / 10
        });
      }

      // Calculate daily activity for last 14 days
      const dailyActivity: any[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTasks = completedTasks.filter((t: any) => {
          const completedDate = new Date(t.completedAt || t.updatedAt);
          return completedDate.toISOString().split('T')[0] === dateStr;
        });
        
        const daySessions = focusSessions.filter((s: any) => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate.toISOString().split('T')[0] === dateStr;
        });
        
        const totalFocusMinutes = daySessions.reduce((sum: number, session: any) => 
          sum + Math.round((session.actualDuration || session.duration || 0) / 60), 0);

        if (dayTasks.length > 0 || totalFocusMinutes > 0) {
          dailyActivity.push({
            date: dateStr,
            tasksCompleted: dayTasks.length,
            focusMinutes: totalFocusMinutes
          });
        }
      }

      // Calculate average completion time
      let averageCompletionTime = 0;
      if (completedTasks.length > 0) {
        const completionTimes = completedTasks
          .filter((t: any) => t.createdAt && t.completedAt)
          .map((t: any) => {
            const created = new Date(t.createdAt);
            const completed = new Date(t.completedAt);
            return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
          });
        
        if (completionTimes.length > 0) {
          averageCompletionTime = Math.round(
            (completionTimes.reduce((sum: number, time: number) => sum + time, 0) / completionTimes.length) * 10
          ) / 10;
        }
      }

      // Generate intelligent insights based on real data
      const insights: any[] = [];
      
      const completionRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
      
      if (completionRate >= 80) {
        insights.push({
          type: 'success',
          message: `🎯 Excellent! You've completed ${completionRate}% of your tasks - you're crushing your goals!`
        });
      } else if (completionRate >= 60) {
        insights.push({
          type: 'success',
          message: `👍 You've completed ${completionRate}% of your tasks - great progress!`
        });
      } else if (completionRate >= 40) {
        insights.push({
          type: 'info',
          message: `📈 You've completed ${completionRate}% of your tasks - keep up the momentum!`
        });
      } else if (completionRate > 0) {
        insights.push({
          type: 'warning',
          message: `🎯 You've completed ${completionRate}% of your tasks - consider focusing on fewer tasks to increase completion rate.`
        });
      }

      if (uniqueProjects.size > 1) {
        insights.push({
          type: 'info',
          message: `⚡ You're actively contributing to ${uniqueProjects.size} different projects.`
        });
      }

      if (inProgressTasks.length > 5) {
        insights.push({
          type: 'warning',
          message: `🔄 You have ${inProgressTasks.length} tasks in progress - consider focusing on fewer tasks at once for better completion rates.`
        });
      } else if (inProgressTasks.length > 0) {
        insights.push({
          type: 'info',
          message: `🎯 You have ${inProgressTasks.length} tasks in progress - good focus level!`
        });
      }

      if (focusSessions.length > 0) {
        const recentSessions = focusSessions.slice(0, 7); // Last 7 sessions
        const avgSessionLength = recentSessions.reduce((sum: number, session: any) => 
          sum + Math.round((session.actualDuration || session.duration || 0) / 60), 0) / recentSessions.length;
        
        if (avgSessionLength >= 25) {
          insights.push({
            type: 'success',
            message: `⏱️ Your average focus session is ${Math.round(avgSessionLength)} minutes - excellent deep work habits!`
          });
        }
      }

      if (averageCompletionTime > 0) {
        if (averageCompletionTime <= 2) {
          insights.push({
            type: 'success',
            message: `⚡ Your average task completion time is ${averageCompletionTime} days - very efficient!`
          });
        } else if (averageCompletionTime <= 5) {
          insights.push({
            type: 'info',
            message: `📅 Your average task completion time is ${averageCompletionTime} days - solid pace!`
          });
        }
      }

      const personalRealAnalytics = {
        userInfo: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          memberSince: user.createdAt,
          totalProjects: uniqueProjects.size
        },
        taskMetrics: {
          total: userTasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          todo: todoTasks.length,
          completionRate,
          averageCompletionTime
        },
        productivityData,
        projectContributions,
        priorityDistribution,
        dailyActivity,
        insights,
        isDemoData: false,
        isPersonalAnalytics: true
      };
      
      res.json(personalRealAnalytics);

    } catch (error) {
      console.error('Personal analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch personal analytics', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

// Helper function to verify project access
async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });
    
    return !!project;
  } catch {
    return false;
  }
}

export default router;