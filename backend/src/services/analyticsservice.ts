import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TaskMetrics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface VelocityData {
  week: string;
  tasksCompleted: number;
}

interface TeamMember {
  id: string;
  name: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface PriorityData {
  priority: string;
  count: number;
  percentage: number;
}

interface CompletionTrend {
  date: string;
  completed: number;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface TaskWithStatus {
  status: string;
  completedAt: Date | null;
  createdAt: Date;
}

interface PriorityGroupBy {
  priority: string;
  _count: number;
}

export class AnalyticsService {
  
  async getProjectAnalytics(projectId: string) {
    const [
      taskMetrics,
      velocityData, 
      teamPerformance,
      priorityDistribution,
      completionTrends
    ] = await Promise.all([
      this.getTaskMetrics(projectId),
      this.getVelocityData(projectId),
      this.getTeamPerformance(projectId),
      this.getPriorityDistribution(projectId),
      this.getCompletionTrends(projectId)
    ]);

    return {
      taskMetrics,
      velocityData,
      teamPerformance,
      priorityDistribution,
      completionTrends,
      insights: this.generateInsights(taskMetrics, velocityData, teamPerformance)
    };
  }

  private async getTaskMetrics(projectId: string): Promise<TaskMetrics> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { column: true }
    });

    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter((t: any) => t.status === 'TODO').length;

    const averageCompletionTime = await this.calculateAverageCompletionTime(projectId);
    
    return {
      total,
      completed,
      inProgress, 
      todo,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageCompletionTime: Math.round(averageCompletionTime)
    };
  }

  private async getVelocityData(projectId: string): Promise<VelocityData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedTasks = await prisma.task.findMany({
      where: {
        projectId,
        status: 'DONE',
        completedAt: { gte: thirtyDaysAgo }
      },
      orderBy: { completedAt: 'asc' }
    });

    const weeklyData = new Map<string, number>();
    completedTasks.forEach((task: any) => {
      if (task.completedAt) {
        const week = this.getWeekKey(task.completedAt);
        weeklyData.set(week, (weeklyData.get(week) || 0) + 1);
      }
    });

    const last4Weeks = this.getLast4Weeks();
    return last4Weeks.map((week: string) => ({
      week,
      tasksCompleted: weeklyData.get(week) || 0
    }));
  }

  private async getTeamPerformance(projectId: string): Promise<TeamMember[]> {
    const teamStats = await prisma.user.findMany({
      where: {
        OR: [
          { ownedProjects: { some: { id: projectId } } },
          { projectMembers: { some: { projectId } } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedTasks: {
          where: { projectId },
          select: {
            status: true,
            priority: true,
            completedAt: true,
            createdAt: true
          }
        }
      }
    });

    return teamStats.map((user: any) => {
      const tasks = user.assignedTasks;
      const completed = tasks.filter((t: TaskWithStatus) => t.status === 'DONE').length;
      const total = tasks.length;
      const avgCompletionTime = this.calculateUserAvgCompletion(tasks);

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        tasksAssigned: total,
        tasksCompleted: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        averageCompletionTime: Math.round(avgCompletionTime)
      };
    });
  }

  private async getPriorityDistribution(projectId: string): Promise<PriorityData[]> {
    const tasks = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true
    });

    return tasks.map((item: PriorityGroupBy) => ({
      priority: item.priority,
      count: item._count,
      percentage: 0
    }));
  }

  private async getCompletionTrends(projectId: string): Promise<CompletionTrend[]> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyCompletions = await Promise.all(
      last7Days.map(async (date: string) => {
        const startOfDay = new Date(date + 'T00:00:00.000Z');
        const endOfDay = new Date(date + 'T23:59:59.999Z');
        
        const completed = await prisma.task.count({
          where: {
            projectId,
            status: 'DONE',
            completedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        return { date, completed };
      })
    );

    return dailyCompletions;
  }

  private generateInsights(taskMetrics: TaskMetrics, velocityData: VelocityData[], teamPerformance: TeamMember[]): Insight[] {
    const insights: Insight[] = [];
    
    if (taskMetrics.completionRate < 40) {
      insights.push({
        type: 'warning',
        message: 'Low completion rate detected. Consider reviewing task complexity or team capacity.'
      });
    }
    
    const avgVelocity = velocityData.reduce((sum: number, week: VelocityData) => sum + week.tasksCompleted, 0) / velocityData.length;
    if (avgVelocity < 2) {
      insights.push({
        type: 'info', 
        message: 'Team velocity is below average. Consider breaking down larger tasks.'
      });
    }

    const topPerformer = teamPerformance.reduce((best: TeamMember | null, current: TeamMember) => 
      current.completionRate > (best?.completionRate || 0) ? current : best, null as TeamMember | null);
    
    if (topPerformer) {
      insights.push({
        type: 'success',
        message: `${topPerformer.name} has the highest completion rate at ${topPerformer.completionRate}%.`
      });
    }

    return insights;
  }

  private async calculateAverageCompletionTime(projectId: string): Promise<number> {
    const completedTasks = await prisma.task.findMany({
      where: { 
        projectId,
        status: 'DONE',
        completedAt: { not: null }
      },
      select: { createdAt: true, completedAt: true }
    });

    if (completedTasks.length === 0) return 0;

    const totalHours = completedTasks.reduce((sum: number, task: any) => {
      if (task.completedAt) {
        const hours = (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    return totalHours / completedTasks.length;
  }

  private calculateUserAvgCompletion(tasks: TaskWithStatus[]): number {
    const completed = tasks.filter((t: TaskWithStatus) => t.status === 'DONE' && t.completedAt);
    if (completed.length === 0) return 0;

    const totalHours = completed.reduce((sum: number, task: TaskWithStatus) => {
      if (task.completedAt) {
        const hours = (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    return totalHours / completed.length;
  }

  private getWeekKey(date: Date): string {
    const week = new Date(date);
    week.setDate(week.getDate() - week.getDay());
    return week.toISOString().split('T')[0];
  }

  private getLast4Weeks(): string[] {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      weeks.push(this.getWeekKey(date));
    }
    return weeks;
  }
}