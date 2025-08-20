// backend/src/controllers/taskController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';

const prisma = new PrismaClient();

// Create new task
export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, description, projectId, columnId, assigneeId, priority } = req.body;

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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        key: taskKey,
        priority: priority || 'MEDIUM',
        position,
        projectId,
        columnId,
        assigneeId,
        creatorId: userId
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

    res.status(201).json({ task, message: 'Task created successfully' });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task (for drag and drop)
export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, columnId, position, status, priority, assigneeId } = req.body;

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
        }
      }
    });

    res.json({ task, message: 'Task updated successfully' });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};