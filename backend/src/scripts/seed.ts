// This creates sample data for development

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // create sample users (John the dev and Sarah the mnger)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const john = await prisma.user.create({
    data: {
      email: 'john@valex.dev',
      username: 'john_dev',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@valex.dev',
      username: 'sarah_manager',
      firstName: 'Sarah',
      lastName: 'Wilson',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  console.log('👥 Created users:', { john: john.email, sarah: sarah.email });

  // create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Valex Development',
      description: 'Building the next-generation task management platform',
      key: 'VALEX',
      color: '#3B82F6',
      ownerId: sarah.id,
    },
  });

  console.log('📁 Created project:', project.name);

  // John (now a project member)
  await prisma.projectMember.create({
    data: {
      userId: john.id,
      projectId: project.id,
      role: 'MEMBER',
    },
  });

  // create columns
  const todoColumn = await prisma.column.create({
    data: {
      name: 'To Do',
      position: 1,
      color: '#64748B',
      projectId: project.id,
    },
  });

  const inProgressColumn = await prisma.column.create({
    data: {
      name: 'In Progress',
      position: 2,
      color: '#F59E0B',
      projectId: project.id,
    },
  });

  const doneColumn = await prisma.column.create({
    data: {
      name: 'Done',
      position: 3,
      color: '#10B981',
      isDefault: true,
      projectId: project.id,
    },
  });

  console.log('📋 Created columns: To Do, In Progress, Done');

  // create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Set up authentication system',
      description: 'Implement JWT-based authentication with bcrypt password hashing',
      key: 'VALEX-1',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      position: 1.0,
      projectId: project.id,
      columnId: inProgressColumn.id,
      assigneeId: john.id,
      creatorId: sarah.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design Kanban board UI',
      description: 'Create responsive drag-and-drop interface using @dnd-kit',
      key: 'VALEX-2',
      status: 'TODO',
      priority: 'MEDIUM',
      position: 1.0,
      projectId: project.id,
      columnId: todoColumn.id,
      assigneeId: john.id,
      creatorId: sarah.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Configure Docker deployment',
      description: 'Set up containerization for production deployment',
      key: 'VALEX-3',
      status: 'DONE',
      priority: 'MEDIUM',
      position: 1.0,
      projectId: project.id,
      columnId: doneColumn.id,
      assigneeId: sarah.id,
      creatorId: sarah.id,
      completedAt: new Date(),
    },
  });

  console.log('✅ Created sample tasks:', [task1.key, task2.key, task3.key]);

  // add a comment to a task
  await prisma.comment.create({
    data: {
      content: 'Started working on the JWT implementation. Planning to use refresh tokens for better security.',
      taskId: task1.id,
      authorId: john.id,
    },
  });

  console.log('💬 Added sample comment');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });