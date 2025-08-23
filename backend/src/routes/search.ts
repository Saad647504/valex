import { Router, Response } from 'express';
import { SearchService } from '../services/searchservice';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const searchService = new SearchService();

router.use(requireAuth);

// Advanced task search with filtering
router.post('/tasks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, filters, page = 1, limit = 20 } = req.body;
    
    const results = await searchService.searchTasks(
      projectId,
      filters,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get recent tasks for user
router.get('/recent', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recentTasks = await searchService.getRecentTasks(userId, limit);
    res.json({ tasks: recentTasks });
    
  } catch (error) {
    console.error('Recent tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch recent tasks' });
  }
});

// Get suggested assignees based on task similarity
router.post('/suggestions/assignees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, taskTitle } = req.body;
    
    const suggestions = await searchService.getSuggestedAssignees(projectId, taskTitle);
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Assignee suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;