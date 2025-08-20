import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';

const prisma = new PrismaClient();

// Get all projects for current user
export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId }, // Projects user owns
          { 
            members: {
              some: { userId } // Projects user is member of
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
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    res.json({ projects });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, description, key, color } = req.body;

    if (!name || !key) {
      res.status(400).json({ error: 'Name and key are required' });
      return;
    }

    // Check if project key already exists
    const existingProject = await prisma.project.findUnique({
      where: { key }
    });

    if (existingProject) {
      res.status(400).json({ error: 'Project key already exists' });
      return;
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

    // Create default columns for the project
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project with tasks
export const getProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
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
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};