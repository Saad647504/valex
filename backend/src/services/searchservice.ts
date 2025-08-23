import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchFilters {
  query?: string;
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  creatorId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SearchResult {
  tasks: any[];
  totalCount: number;
  facets: {
    statuses: Array<{ value: string; count: number }>;
    priorities: Array<{ value: string; count: number }>;
    assignees: Array<{ id: string; name: string; count: number }>;
  };
}

export class SearchService {
  
  async searchTasks(
    projectId: string, 
    filters: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    const offset = (page - 1) * limit;
    
    // Build dynamic where clause
    const whereClause: any = { projectId };
    
    // Text search across title and description
    if (filters.query) {
      whereClause.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { key: { contains: filters.query, mode: 'insensitive' } }
      ];
    }
    
    // Status filtering
    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }
    
    // Priority filtering  
    if (filters.priority && filters.priority.length > 0) {
      whereClause.priority = { in: filters.priority };
    }
    
    // Assignee filtering
    if (filters.assigneeId) {
      whereClause.assigneeId = filters.assigneeId;
    }
    
    // Creator filtering
    if (filters.creatorId) {
      whereClause.creatorId = filters.creatorId;
    }
    
    // Date range filtering
    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }
    
    // Execute search with pagination
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, avatar: true }
          },
          creator: {
            select: { id: true, firstName: true, lastName: true }
          },
          column: {
            select: { id: true, name: true, color: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.task.count({ where: whereClause })
    ]);
    
    // Generate facets for filtering UI
    const facets = await this.generateFacets(projectId, whereClause);
    
    return {
      tasks,
      totalCount,
      facets
    };
  }
  
  async getRecentTasks(userId: string, limit: number = 10) {
    return prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId }
        ]
      },
      include: {
        project: {
          select: { id: true, name: true, key: true }
        },
        column: {
          select: { name: true, color: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });
  }
  
  async getSuggestedAssignees(projectId: string, taskTitle: string) {
    // Find users who have completed similar tasks
    const similarTasks = await prisma.task.findMany({
      where: {
        projectId,
        status: 'DONE',
        title: {
          contains: this.extractKeywords(taskTitle)[0] || '',
          mode: 'insensitive'
        }
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
    
    // Count completions by assignee
    const assigneeCounts = new Map();
    similarTasks.forEach((task:any) => {
      if (task.assignee) {
        const key = task.assignee.id;
        assigneeCounts.set(key, {
          ...task.assignee,
          count: (assigneeCounts.get(key)?.count || 0) + 1
        });
      }
    });
    
    return Array.from(assigneeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }
  
  private async generateFacets(projectId: string, baseWhere: any) {
    // Use the same filters that were applied to the search to get accurate counts
    const facetWhere = { ...baseWhere };
    
    const [statuses, priorities, assignees] = await Promise.all([
      // Status facets - remove status filter to show all status options
      prisma.task.groupBy({
        by: ['status'],
        where: { ...facetWhere, status: undefined },
        _count: true,
        orderBy: { _count: { status: 'desc' } }
      }),
      
      // Priority facets - remove priority filter to show all priority options
      prisma.task.groupBy({
        by: ['priority'],
        where: { ...facetWhere, priority: undefined },
        _count: true,
        orderBy: { _count: { priority: 'desc' } }
      }),
      
      // Assignee facets
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { ...facetWhere, assigneeId: { not: null }, priority: undefined, status: undefined },
        _count: true,
        orderBy: { _count: { assigneeId: 'desc' } }
      })
    ]);
  
    // Get assignee details
    const assigneeIds = assignees.map((a:any) => a.assigneeId).filter(Boolean);
    const assigneeDetails = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, firstName: true, lastName: true }
    });
  
    return {
      statuses: statuses.map((s:any) => ({
        value: s.status,
        count: s._count
      })),
      priorities: priorities.map((p:any) => ({
        value: p.priority,
        count: p._count
      })),
      assignees: assignees.map((a:any) => {
        const user = assigneeDetails.find((u:any) => u.id === a.assigneeId);
        return {
          id: a.assigneeId!,
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          count: a._count
        };
      })
    };
  }
  
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3);
  }
}