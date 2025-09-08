import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import { AIService } from '../services/aiservice';
import { createNotification } from '../routes/notifications';

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
    const { title, description, projectId, columnId, assigneeId, priority, estimatedMinutes, useAI } = req.body;

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

    // Generate unique task key by finding the next available number
    let taskNumber = 1;
    let taskKey = `${project.key}-${taskNumber}`;
    
    // Keep incrementing until we find a unique key
    while (await prisma.task.findUnique({ where: { key: taskKey } })) {
      taskNumber++;
      taskKey = `${project.key}-${taskNumber}`;
    }

    // Get next position in column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    const position = lastTask ? lastTask.position + 1.0 : 1.0;

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
        try {
          aiAnalysis = await aiService.analyzeTask(title, description, allTeamMembers);
          suggestedAssigneeId = findUserByName(allTeamMembers, aiAnalysis.suggestedAssignee) || assigneeId;
        } catch (e) {
          // AI may fail; fallback handled below
        }

        // Fallback: pick the team member with the lowest in-progress workload if AI didn't give a valid user
        if (!suggestedAssigneeId) {
          const memberIds = allTeamMembers.map((m: any) => m.id);
          // Count IN_PROGRESS tasks per member within this project
          const memberTaskCounts = await prisma.task.groupBy({
            by: ['assigneeId'],
            where: {
              projectId,
              status: 'IN_PROGRESS',
              assigneeId: { in: memberIds }
            },
            _count: { assigneeId: true }
          });

          const countsMap = new Map<string, number>();
          memberIds.forEach((id: string) => countsMap.set(id, 0));
          memberTaskCounts.forEach((row: any) => countsMap.set(row.assigneeId, row._count.assigneeId));

          let minId: string | undefined;
          let minCount = Number.POSITIVE_INFINITY;
          countsMap.forEach((count, id) => {
            if (count < minCount) {
              minCount = count;
              minId = id;
            }
          });

          suggestedAssigneeId = minId || assigneeId;
        }
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
        estimatedMinutes,
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
        ...(assigneeId !== undefined && { assigneeId }),
        // Set completedAt when status is changed to DONE
        ...(status === 'DONE' && { completedAt: new Date() })
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

    // Create notification if task was completed
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      try {
        // Get user who completed the task
        const completer = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true }
        });

        // Notify project members (excluding the completer)
        const projectMembers = await prisma.projectMember.findMany({
          where: { projectId: task.projectId },
          include: { user: { select: { id: true } } }
        });

        const notifications = projectMembers
          .filter(member => member.user.id !== userId)
          .map(member => createNotification({
            userId: member.user.id,
            type: 'TASK_COMPLETED',
            title: 'Task Completed',
            message: `${completer?.firstName} ${completer?.lastName} completed "${task.title}"`,
            data: {
              taskId: task.id,
              taskTitle: task.title,
              projectId: task.projectId,
              completedBy: `${completer?.firstName} ${completer?.lastName}`
            }
          }));

        await Promise.all(notifications);
      } catch (notificationError) {
        console.error('Failed to create task completion notification:', notificationError);
      }
    }

    // Create notification if task was assigned to someone
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== userId) {
      try {
        const assigner = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true }
        });

        await createNotification({
          userId: assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `${assigner?.firstName} ${assigner?.lastName} assigned "${task.title}" to you`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.projectId,
            assignedBy: `${assigner?.firstName} ${assigner?.lastName}`
          }
        });
      } catch (notificationError) {
        console.error('Failed to create task assignment notification:', notificationError);
      }
    }

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

    // Get column information to determine status changes based on column name
    const targetColumn = await prisma.column.findUnique({
      where: { id: columnId },
      select: { name: true }
    });
    
    const targetName = (targetColumn?.name || '').toLowerCase();
    const targetNameNormalized = targetName.replace(/\s|-/g, '');
    // Broadened semantics for common column naming variants
    const isCompletedColumn = (
      targetName.includes('done') ||
      targetName.includes('complete') ||
      targetName.includes('completed') ||
      targetName.includes('finished') ||
      targetName.includes('closed')
    );
    const isInProgressColumn = (
      targetName.includes('progress') ||
      targetName.includes('doing') ||
      targetName.includes('active') ||
      targetName.includes('working') ||
      targetNameNormalized.includes('inprogress') ||
      targetNameNormalized.includes('wip')
    );
    const isTodoColumn = (
      targetName.includes('to do') ||
      targetName.includes('todo') ||
      targetName.includes('backlog') ||
      targetName.includes('queue') ||
      targetName.includes('planned')
    );

    const task = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        position,
        // Automatically update status based on target column semantics
        ...(isCompletedColumn
          ? { status: 'DONE', completedAt: new Date() }
          : isInProgressColumn
          ? { status: 'IN_PROGRESS', completedAt: null }
          : isTodoColumn
          ? { status: 'TODO', completedAt: null }
          : {}),
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

// Delete task
export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

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

    // Delete the task
    await prisma.task.delete({
      where: { id }
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${existingTask.projectId}`).emit('task-deleted', {
        taskId: id,
        projectId: existingTask.projectId
      });
    }

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Auto-assign task using AI with workload fallback
export const autoAssignTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify user has access to this task and fetch project
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      },
      include: { project: true }
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const projectId = task.projectId;

    // Build team list (owner + members)
    const teamMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } }
    });
    const owner = await prisma.user.findUnique({
      where: { id: task.project.ownerId },
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    const allTeamMembers = [ ...(owner ? [owner] : []), ...teamMembers.map((m:any) => m.user) ];

    if (allTeamMembers.length === 0) {
      res.status(400).json({ error: 'No team members available for assignment' });
      return;
    }

    // Try AI analysis
    let aiAnalysis: any = null;
    let suggestedAssigneeId: string | undefined;
    try {
      aiAnalysis = await aiService.analyzeTask(task.title, task.description || '', allTeamMembers);
      suggestedAssigneeId = findUserByName(allTeamMembers, aiAnalysis.suggestedAssignee);
    } catch {}

    // Fallback by workload if no suggestion from AI
    if (!suggestedAssigneeId) {
      const memberIds = allTeamMembers.map((m: any) => m.id);
      const memberTaskCounts = await prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId, status: 'IN_PROGRESS', assigneeId: { in: memberIds } },
        _count: { assigneeId: true }
      });
      const countsMap = new Map<string, number>();
      memberIds.forEach((id: string) => countsMap.set(id, 0));
      memberTaskCounts.forEach((row: any) => countsMap.set(row.assigneeId, row._count.assigneeId));
      let minId: string | undefined;
      let minCount = Number.POSITIVE_INFINITY;
      countsMap.forEach((count, id) => { if (count < minCount) { minCount = count; minId = id; } });
      suggestedAssigneeId = minId;
    }

    if (!suggestedAssigneeId) {
      res.status(400).json({ error: 'Failed to determine assignee' });
      return;
    }

    // Update task assignment
    const updated = await prisma.task.update({
      where: { id },
      data: { assigneeId: suggestedAssigneeId },
      include: { assignee: { select: { id: true, firstName: true, lastName: true, email: true } } }
    });

    // Notify the new assignee
    try {
      await createNotification({
        userId: suggestedAssigneeId!,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned by AI',
        message: `"${updated.title}" was assigned to you`,
        data: { taskId: updated.id, taskTitle: updated.title, projectId }
      });
    } catch {}

    // Emit update
    const io = req.app.get('io');
    if (io) io.to(`project:${projectId}`).emit('task-updated', { task: updated });

    res.json({ task: updated, aiAnalysis, message: 'Task auto-assigned' });
  } catch (error) {
    console.error('Auto-assign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
