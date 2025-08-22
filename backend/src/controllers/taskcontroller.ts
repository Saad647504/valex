import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { AIService } from '../services/aiservice';

const prisma = new PrismaClient();
const aiService = new AIService();

function findUserByName(teamMembers: any[], suggestedName: string): string | undefined {
  if (!suggestedName || !teamMembers) return undefined;
  
  const member = teamMembers.find(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(suggestedName.toLowerCase())
  );
  return member?.id;
}

// Create new task
export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, description, projectId, columnId, assigneeId, priority, useAI } = req.body;

    if (!title || !projectId || !columnId) {
      res.status(400).json({ error: 'Title, projectId, and columnId are required' });
      return;
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
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Generate task key
    const taskCount = await prisma.task.count({
      where: { projectId }
    });
    const taskKey = `${project.key}-${taskCount + 1}`;

    // Get next position in column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    const position = lastTask ? lastTask.position + 1 : 1;

    // AI Analysis
    let aiAnalysis = null;
    let suggestedAssigneeId = assigneeId;

    if (useAI) {
      console.log('Entering AI analysis path...');
      // Get team members for AI analysis
      const teamMembers = await prisma.projectMember.findMany({
        where: { projectId },
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
      });
      
      // Include project owner as a team member for AI analysis
      const projectOwner = await prisma.user.findUnique({
        where: { id: project.ownerId },
        select: { id: true, firstName: true, lastName: true, role: true }
      });
      
      const allTeamMembers = [
        ...(projectOwner ? [projectOwner] : []),
        ...teamMembers.map((m:any) => m.user)
      ];
      
      console.log('All team members:', allTeamMembers.length);
      
      if (allTeamMembers.length > 0) {
        aiAnalysis = await aiService.analyzeTask(title, description, allTeamMembers);
        suggestedAssigneeId = findUserByName(allTeamMembers, aiAnalysis.suggestedAssignee) || assigneeId;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        key: taskKey,
        priority: aiAnalysis?.complexity || priority || 'MEDIUM',
        position,
        projectId,
        columnId,
        assigneeId: suggestedAssigneeId,
        creatorId: userId,
        aiInsights: aiAnalysis ? JSON.stringify(aiAnalysis) : null
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

    // Emit real-time update to all users in this project
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('task-created', {
        task,
        columnId,
        aiAnalysis
      });
    }

    res.status(201).json({ 
      task, 
      aiAnalysis,
      message: 'Task created successfully' 
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task (for editing)
export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, columnId, position, status, priority, assigneeId, useAI } = req.body;
    console.log('useAI parameter:', useAI);
    console.log('OpenAI API key exists:', !!process.env.OPENAI_API_KEY);

    // Verify user has access to this task
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
      res.status(404).json({ error: 'Task not found' });
      return;
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
        ...(assigneeId !== undefined && { assigneeId })
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
        project: true
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.projectId}`).emit('task-updated', {
        task
      });
    }

    res.json({ task, message: 'Task updated successfully' });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Move task (for drag & drop)
export const moveTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { columnId, position, fromColumn } = req.body;

    // Verify user has access to this task
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
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        position
      },
      include: {
        project: true,
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

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.projectId}`).emit('task-moved', {
        taskId: id,
        fromColumn,
        toColumn: columnId,
        position,
        task
      });
    }

    res.json({ task, message: 'Task moved successfully' });

  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};