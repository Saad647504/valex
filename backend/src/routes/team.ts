import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { Response } from 'express';
import { createNotification } from './notifications';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Send invitation to join project team
router.post('/projects/:projectId/invite', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Verify user has permission to invite (must be project owner or admin)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['OWNER', 'ADMIN'] }
              } 
            } 
          }
        ]
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        email,
        projectId,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      res.status(400).json({ error: 'Invitation already sent to this email for this project' });
      return;
    }

    // Check if user exists and is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: existingUser.id,
            projectId
          }
        }
      });

      if (existingMember || existingUser.id === project.ownerId) {
        res.status(400).json({ error: 'User is already a member of this project' });
        return;
      }
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await prisma.projectInvitation.create({
      data: {
        email,
        role: role.toUpperCase() as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
        token,
        expiresAt,
        projectId,
        inviterId: userId,
        inviteeId: existingUser?.id
      },
      include: {
        project: {
          select: { name: true }
        },
        inviter: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Create notification if user exists
    if (existingUser) {
      try {
        await createNotification({
          userId: existingUser.id,
          type: 'TEAM_INVITE',
          title: 'Team Invitation',
          message: `${invitation.inviter.firstName} ${invitation.inviter.lastName} invited you to join ${invitation.project.name}`,
          data: {
            invitationId: invitation.id,
            projectId,
            projectName: invitation.project.name,
            inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
            role,
            token
          }
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }
    }

    res.status(201).json({ 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      },
      message: `Invitation sent to ${email}`
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite user to project team by user ID (new method)
router.post('/projects/:projectId/invite-user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;
    const { userId: inviteUserId, role = 'MEMBER' } = req.body;

    if (!inviteUserId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Verify user has permission to invite (must be project owner or admin)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['OWNER', 'ADMIN'] }
              } 
            } 
          }
        ]
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Find user by ID
    const inviteUser = await prisma.user.findUnique({
      where: { id: inviteUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!inviteUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: inviteUser.id,
          projectId
        }
      }
    });

    if (existingMember) {
      res.status(400).json({ error: 'User is already a member of this project' });
      return;
    }

    // Check if user is the project owner
    if (inviteUser.id === project.ownerId) {
      res.status(400).json({ error: 'User is already the project owner' });
      return;
    }

    // Add user to project and create colleague relations
    const member = await prisma.$transaction(async (tx) => {
      // Create project member
      const member = await tx.projectMember.create({
        data: {
          userId: inviteUser.id,
          projectId,
          role: role.toUpperCase() as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
        },
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
      });

      // Create colleague relations with existing project members
      const existingMembers = await tx.projectMember.findMany({
        where: {
          projectId,
          userId: { not: inviteUser.id }
        },
        include: {
          user: { select: { id: true } }
        }
      });

      // Also include the project owner if not already in members
      const allMemberIds = [...existingMembers.map(m => m.user.id)];
      if (!allMemberIds.includes(project.ownerId)) {
        allMemberIds.push(project.ownerId);
      }

      // Create bidirectional colleague relationships
      for (const memberId of allMemberIds) {
        // Check if relation already exists (either direction)
        const existingRelation = await tx.colleagueRelation.findFirst({
          where: {
            OR: [
              { fromUserId: inviteUser.id, toUserId: memberId },
              { fromUserId: memberId, toUserId: inviteUser.id }
            ]
          }
        });

        if (!existingRelation) {
          // Create relationship from invited user to member
          await tx.colleagueRelation.create({
            data: {
              fromUserId: inviteUser.id,
              toUserId: memberId,
              status: 'ACTIVE'
            }
          });

          // Create reverse relationship
          await tx.colleagueRelation.create({
            data: {
              fromUserId: memberId,
              toUserId: inviteUser.id,
              status: 'ACTIVE'
            }
          });
        }
      }

      return member;
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('member-added', {
        member,
        projectId
      });
    }

    res.status(201).json({ 
      member,
      message: `${inviteUser.firstName} ${inviteUser.lastName} has been added to the project`
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project members
router.get('/projects/:projectId/members', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
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
        }
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Project not found or access denied' });
      return;
    }

    // Format response
    const allMembers = [
      {
        id: 'owner',
        role: 'OWNER',
        joinedAt: project.createdAt,
        user: project.owner
      },
      ...project.members
    ];

    res.json({ members: allMembers });

  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from project
router.delete('/projects/:projectId/members/:memberId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId, memberId } = req.params;

    // Verify user has permission to remove members (must be project owner or admin)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['OWNER', 'ADMIN'] }
              } 
            } 
          }
        ]
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Cannot remove project owner
    if (memberId === project.ownerId) {
      res.status(400).json({ error: 'Cannot remove project owner' });
    return;
    }

    // Remove member
    const deletedMember = await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId
        }
      },
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
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('member-removed', {
        memberId,
        projectId
      });
    }

    res.json({ 
      message: `${deletedMember.user.firstName} ${deletedMember.user.lastName} has been removed from the project`
    });

  } catch (error: any) {
    console.error('Remove member error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation
router.post('/invitations/:token/accept', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token } = req.params;

    // Find invitation
    const invitation = await prisma.projectInvitation.findFirst({
      where: {
        token,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        project: { select: { name: true } }
      }
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invitation' });
      return;
    }

    // Check if invitation is for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user || user.email !== invitation.email) {
      res.status(403).json({ error: 'This invitation is not for you' });
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: invitation.projectId
        }
      }
    });

    if (existingMember) {
      res.status(400).json({ error: 'You are already a member of this project' });
      return;
    }

    // Accept invitation - create project member, update invitation, and create colleague relations
    const member = await prisma.$transaction(async (tx) => {
      // Create project member
      const member = await tx.projectMember.create({
        data: {
          userId,
          projectId: invitation.projectId,
          role: invitation.role
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      // Update invitation status
      await tx.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      // Create colleague relations between the new member and existing project members
      const existingMembers = await tx.projectMember.findMany({
        where: {
          projectId: invitation.projectId,
          userId: { not: userId }
        },
        include: {
          user: { select: { id: true } }
        }
      });

      // Also include the project owner
      const project = await tx.project.findUnique({
        where: { id: invitation.projectId },
        select: { ownerId: true }
      });

      const allMemberIds = [...existingMembers.map(m => m.user.id)];
      if (project && !allMemberIds.includes(project.ownerId)) {
        allMemberIds.push(project.ownerId);
      }

      // Create bidirectional colleague relationships
      for (const memberId of allMemberIds) {
        // Check if relation already exists (either direction)
        const existingRelation = await tx.colleagueRelation.findFirst({
          where: {
            OR: [
              { fromUserId: userId, toUserId: memberId },
              { fromUserId: memberId, toUserId: userId }
            ]
          }
        });

        if (!existingRelation) {
          // Create relationship from current user to member
          await tx.colleagueRelation.create({
            data: {
              fromUserId: userId,
              toUserId: memberId,
              status: 'ACTIVE'
            }
          });

          // Create reverse relationship
          await tx.colleagueRelation.create({
            data: {
              fromUserId: memberId,
              toUserId: userId,
              status: 'ACTIVE'
            }
          });
        }
      }

      return member;
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${invitation.projectId}`).emit('member-added', {
        member,
        projectId: invitation.projectId
      });
    }

    res.json({
      message: `Successfully joined ${invitation.project.name}`,
      member
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Decline invitation
router.post('/invitations/:token/decline', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token } = req.params;

    // Find invitation
    const invitation = await prisma.projectInvitation.findFirst({
      where: {
        token,
        status: 'PENDING'
      },
      include: {
        project: { select: { name: true } }
      }
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    // Check if invitation is for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user || user.email !== invitation.email) {
      res.status(403).json({ error: 'This invitation is not for you' });
      return;
    }

    // Decline invitation
    await prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' }
    });

    res.json({
      message: `Declined invitation to ${invitation.project.name}`
    });

  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's pending invitations
router.get('/invitations/pending', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const invitations = await prisma.projectInvitation.findMany({
      where: {
        email: user.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        project: {
          select: { name: true, description: true }
        },
        inviter: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invitations });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role (admin only)
router.patch('/projects/:projectId/members/:memberId/role', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    // Verify user has permission to change roles (must be project owner or admin)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['OWNER', 'ADMIN'] }
              } 
            } 
          }
        ]
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Cannot change project owner's role
    if (memberId === project.ownerId) {
      res.status(400).json({ error: 'Cannot change project owner role' });
      return;
    }

    // Update member role
    const member = await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId: memberId,
          projectId
        }
      },
      data: {
        role: role.toUpperCase() as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('member-role-updated', {
        member,
        projectId
      });
    }

    res.json({
      message: `Updated ${member.user.firstName} ${member.user.lastName}'s role to ${role}`,
      member
    });

  } catch (error: any) {
    console.error('Update member role error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's colleagues
router.get('/colleagues', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const colleagues = await prisma.colleagueRelation.findMany({
      where: {
        fromUserId: userId,
        status: 'ACTIVE'
      },
      include: {
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        connectedAt: 'desc'
      }
    });

    res.json({ colleagues });
  } catch (error) {
    console.error('Get colleagues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove colleague relationship
router.delete('/colleagues/:colleagueId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { colleagueId } = req.params;

    await prisma.$transaction(async (tx) => {
      // Remove both directions of the relationship
      await tx.colleagueRelation.deleteMany({
        where: {
          OR: [
            { fromUserId: userId, toUserId: colleagueId },
            { fromUserId: colleagueId, toUserId: userId }
          ]
        }
      });
    });

    res.json({ message: 'Colleague relationship removed' });
  } catch (error) {
    console.error('Remove colleague error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if invitation can be sent (prevent duplicates)
router.get('/projects/:projectId/can-invite/:email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId, email } = req.params;

    // Verify user has permission to check invitations
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { 
            members: { 
              some: { 
                userId,
                role: { in: ['OWNER', 'ADMIN'] }
              } 
            } 
          }
        ]
      }
    });

    if (!project) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      res.json({ canInvite: true, reason: 'User not found, invitation will be sent via email' });
      return;
    }

    // Check if user is project owner
    if (user.id === project.ownerId) {
      res.json({ canInvite: false, reason: 'User is already the project owner' });
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId
        }
      }
    });

    if (existingMember) {
      res.json({ canInvite: false, reason: 'User is already a member of this project' });
      return;
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        email,
        projectId,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      res.json({ canInvite: false, reason: 'Invitation already sent to this email for this project' });
      return;
    }

    res.json({ canInvite: true, reason: 'User can be invited' });
  } catch (error) {
    console.error('Check can invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;