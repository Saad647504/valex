import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All note routes require authentication
router.use(requireAuth);

// Get all notes visible to current user (personal + team-shared by project)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { search, tag, projectId } = req.query as { search?: string; tag?: string; projectId?: string };

    // Determine projects the user can access (owner or member)
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const memberProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const accessibleProjectIds = Array.from(new Set([
      ...ownedProjects.map(p => p.id),
      ...memberProjects.map(m => m.projectId)
    ]));

    // Visibility: user's own notes OR notes in accessible projects
    const visibilityOr: any[] = [ { userId } ];
    if (accessibleProjectIds.length > 0) {
      visibilityOr.push({ projectId: { in: accessibleProjectIds } });
    }

    // Optional filters
    const andFilters: any[] = [];
    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    if (tag) {
      andFilters.push({ tags: { has: tag } });
    }
    if (projectId) {
      // If caller requests a specific project, restrict to it (but still include personal notes only if they belong to that project)
      andFilters.push({ OR: [ { projectId: projectId }, { AND: [ { projectId: null }, { userId } ] } ] });
    }

    const notes = await prisma.note.findMany({
      where: {
        AND: [
          { OR: visibilityOr },
          ...andFilters
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ notes });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Create new note
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, content, color, tags, projectId, isPinned, isStarred } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    // If attaching to a project, verify the user has access (owner or member)
    if (projectId) {
      const hasAccess = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        },
        select: { id: true }
      });
      if (!hasAccess) {
        res.status(403).json({ error: 'You do not have access to this project' });
        return;
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        color: color || '#64748b',
        tags: tags || [],
        projectId,
        userId,
        isPinned: isPinned || false,
        isStarred: isStarred || false
      }
    });

    res.status(201).json({ 
      note,
      message: 'Note created successfully' 
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, content, color, tags, projectId, isPinned, isStarred } = req.body;

    // Verify user owns the note
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: title || existingNote.title,
        content: content || existingNote.content,
        color: color || existingNote.color,
        tags: tags || existingNote.tags,
        projectId: projectId !== undefined ? projectId : existingNote.projectId,
        isPinned: isPinned !== undefined ? isPinned : existingNote.isPinned,
        isStarred: isStarred !== undefined ? isStarred : existingNote.isStarred
      }
    });

    res.json({ 
      note,
      message: 'Note updated successfully' 
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify user owns the note
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    await prisma.note.delete({
      where: { id }
    });

    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get note by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ note });

  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

export default router;
