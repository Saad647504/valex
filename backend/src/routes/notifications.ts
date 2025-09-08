import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { unreadOnly = 'false', limit = '20' } = req.query as any;
    const limitNum = Number.parseInt(String(limit), 10);
    const take = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 200 ? limitNum : 20;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly === 'true' && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({ 
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification (internal use for other services)
export const createNotification = async (data: {
  userId: string;
  type: 'TEAM_INVITE' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_UPDATED' | 'SESSION_COMPLETED' | 'AI_INSIGHT' | 'SYSTEM';
  title: string;
  message: string;
  data?: any;
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {}
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export default router;
