import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All session routes require authentication
router.use(requireAuth);

// Start a new focus session
router.post('/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { duration, projectId, taskId, sessionType = 'FOCUS' } = req.body;

    if (!duration) {
      res.status(400).json({ error: 'Duration is required' });
      return;
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

// Complete a focus session
router.post('/:id/complete', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
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
      res.status(404).json({ error: 'Active session not found' });
      return;
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

    // User statistics will be calculated on-demand from focus sessions

    res.json({
      session: updatedSession,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Pause/Resume session
router.post('/:id/pause', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const session = await prisma.focusSession.findFirst({
      where: {
        id,
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] }
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
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

// Get user's session statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
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

// Get current active session
router.get('/active', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

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
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});


// Helper function to calculate streak
async function calculateStreak(userId: string): Promise<number> {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 100 // Look at last 100 sessions
    });

    let streak = 0;
    const today = new Date().toDateString();
    let currentDate = today;
    
    for (const session of sessions) {
      const sessionDate = session.startedAt.toDateString();
      if (sessionDate === currentDate) {
        if (streak === 0) streak = 1;
        // Move to previous day
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
}

export default router;