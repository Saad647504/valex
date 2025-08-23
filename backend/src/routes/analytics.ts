import { Router, Response } from 'express';
import { AnalyticsService } from '../services/analyticsservice';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const analyticsService = new AnalyticsService();

// All analytics routes require authentication
router.use(requireAuth);

// Get comprehensive project analytics
router.get('/project/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;

    // Verify user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, userId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to project analytics' });
      return;
    }

    const analytics = await analyticsService.getProjectAnalytics(projectId);
    res.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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