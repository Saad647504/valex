import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TaskAnalysis {
  suggestedAssignee: string;
  estimatedHours: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  reasoning: string;
}

export class AIService {
  async chatWithAI(message: string, context?: any, userId?: string): Promise<string> {
    // Build comprehensive context string
    let contextString = 'None';
    if (context) {
      if (typeof context === 'object' && context.user) {
        contextString = `
User: ${context.user.name} (${context.user.role})
Current Activity: ${context.currentActivity}
Projects: ${context.projects?.count || 0} active projects
Total Tasks: ${context.totalTasks || 0}
Location: ${context.location || 'VALEX App'}
Projects Details: ${context.projects?.list?.map((p: any) => `${p.name} (${p.taskCount} tasks)`).join(', ') || 'None'}
Timestamp: ${context.timestamp}`;
      } else {
        contextString = JSON.stringify(context);
      }
    }

    const systemPrompt = `You are an AI assistant for VALEX, a comprehensive project management application. You have complete visibility into the user's activity and projects.

CURRENT USER CONTEXT:
${contextString}

You help with:
- Task creation, analysis, and management
- Team performance insights and optimization
- Project planning and workflow improvements
- Sprint planning and resource allocation
- Code review and development guidance
- Real-time assistance based on current user activity

IMPORTANT: You have full knowledge of what the user is currently doing in the application. Reference their specific projects, tasks, and current activity context when providing assistance. Be specific, actionable, and contextually aware.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || "I'm having trouble processing that request. Can you try rephrasing it?";
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error; // This will trigger the fallback in the route
    }
  }

  async analyzeTask(
    title: string, 
    description: string, 
    teamMembers: any[]
  ): Promise<TaskAnalysis> {
    const prompt = `
Analyze this software development task and provide intelligent assignment suggestions:

Task: ${title}
Description: ${description}

Team Members:
${teamMembers.map(member => 
  `- ${member.firstName} ${member.lastName} (${member.role}): Previous tasks completed: ${member.completedTasks || 0}`
).join('\n')}

Based on the task content, team member expertise, and workload, provide:
1. Best assignee and why
2. Estimated hours (be realistic)
3. Complexity level
4. Relevant skill tags
5. Brief reasoning

Respond in JSON format:
{
  "suggestedAssignee": "member name",
  "estimatedHours": number,
  "complexity": "LOW|MEDIUM|HIGH", 
  "tags": ["tag1", "tag2"],
  "reasoning": "explanation"
}`;

    try {
        console.log('About to call OpenAI API...');
        console.log('API key configured:', !!process.env.OPENAI_API_KEY);
        const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        suggestedAssignee: "Manual assignment needed",
        estimatedHours: 4,
        complexity: 'MEDIUM',
        tags: [],
        reasoning: "AI analysis unavailable"
      };
    }
  }

  async generateTaskSuggestions(projectContext: string): Promise<string[]> {
    // Parse context to determine user's activity level
    const hasProjects = projectContext.includes(' 0 projects') ? false : true;
    const hasTasks = projectContext.includes('0 total tasks') ? false : true;
    const isNewUser = !hasProjects || !hasTasks;

    let prompt = '';
    let fallbackSuggestions = [];

    if (isNewUser) {
      // Beginner/Getting Started suggestions
      prompt = `
A new user started a project. Use their project context below (name, description, representative tasks, counts) to ground suggestions:
"""
${projectContext}
"""
Generate 5 simple, actionable tasks specific to this project's domain (not generic onboarding), helping them make tangible progress.
Return as a JSON array of task titles only.`;

      fallbackSuggestions = [
        "Create your first project",
        "Add a simple task to get started", 
        "Set up your workspace preferences",
        "Invite a team member to collaborate",
        "Create a quick note for your ideas"
      ];
    } else {
      // Advanced user suggestions
      prompt = `
You are generating actionable tasks grounded in the specific project domain below.
Project context (name, description, representative tasks, workload snapshot):
"""
${projectContext}
"""

Requirements:
- Produce 5 concrete next tasks directly relevant to this project’s goals and domain.
- Avoid generic suggestions; tie each item to the project description and current workload (e.g., overdue, unassigned, missing estimates).
- Keep each task title concise (<= 80 chars) and self‑contained.

Return as a JSON array of strings only.`;

      fallbackSuggestions = [
        "Set up automated task workflows",
        "Implement advanced project analytics", 
        "Create custom task templates",
        "Optimize team collaboration processes",
        "Build comprehensive reporting system"
      ];
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      return fallbackSuggestions;
    }
  }

  async generateInsights(projects: any[], userId: string, sessionStats?: any): Promise<any[]> {
    try {
      // Flatten tasks for global metrics
      const allTasks: any[] = projects.flatMap((p) => p.tasks || []);

      const isDone = (t: any) => t.status === 'DONE' || /done|complete/i.test(t?.column?.name || '');
      const isInProgress = (t: any) => t.status === 'IN_PROGRESS' || /progress|doing|active|working|wip/i.test(t?.column?.name || '');
      const isTodo = (t: any) => t.status === 'TODO' || /to ?do|backlog|queue|planned/i.test(t?.column?.name || '');

      const totalTasks = allTasks.length;
      const doneCount = allTasks.filter(isDone).length;
      const inProgressCount = allTasks.filter(isInProgress).length;
      const todoCount = allTasks.filter(isTodo).length;
      const overdueCount = allTasks.filter((t) => t.dueDate && !isDone(t) && new Date(t.dueDate) < new Date()).length;
      const unassignedCount = allTasks.filter((t) => !t.assignee && !isDone(t)).length;
      const noEstimateCount = allTasks.filter((t) => !t.estimatedMinutes && !isDone(t)).length;

      // Team size across accessible projects
      const allMembers = new Set<string>();
      projects.forEach((p) => {
        if (p.owner) allMembers.add(`${p.owner.firstName} ${p.owner.lastName}`);
        p.members?.forEach((m: any) => {
          if (m.user) allMembers.add(`${m.user.firstName} ${m.user.lastName}`);
        });
      });

      const insights: any[] = [];

      // Completion performance
      if (totalTasks > 0) {
        const completionRate = Math.round((doneCount / totalTasks) * 100);
        insights.push({
          type: 'performance',
          title: `${completionRate}% completion across ${totalTasks} tasks`,
          description: `${doneCount} done • ${inProgressCount} in progress • ${todoCount} to do`,
          action: 'View detailed analytics'
        });
      } else {
        insights.push({
          type: 'suggestion',
          title: 'No tasks found',
          description: projects.length > 0 ? 'Start by creating tasks in your projects' : 'Create your first project to get started',
          action: projects.length > 0 ? 'Create Task' : 'Create Project'
        });
      }

      // Overdue work
      if (overdueCount > 0) {
        insights.push({
          type: 'workload',
          title: `${overdueCount} overdue ${overdueCount === 1 ? 'task' : 'tasks'}`,
          description: 'Review due dates or reassign to keep delivery on track',
          action: 'Prioritize tasks'
        });
      }

      // WIP check
      if (inProgressCount > Math.max(5, doneCount * 2)) {
        insights.push({
          type: 'optimization',
          title: 'High work-in-progress detected',
          description: `Currently ${inProgressCount} tasks in progress. Consider limiting WIP to boost throughput.`,
          action: 'Optimize team workflow'
        });
      }

      // Unassigned tasks
      if (unassignedCount > 0) {
        insights.push({
          type: 'workload',
          title: `${unassignedCount} unassigned ${unassignedCount === 1 ? 'task' : 'tasks'}`,
          description: 'Assign owners to improve accountability and flow',
          action: 'Redistribute tasks'
        });
      }

      // Missing estimates
      if (noEstimateCount > 0) {
        insights.push({
          type: 'suggestion',
          title: `${noEstimateCount} tasks missing estimates` ,
          description: 'Add estimates to improve planning and focus sessions',
          action: 'Prioritize tasks'
        });
      }

      // Project setup checks
      projects.forEach((p) => {
        const colCount = p.columns?.length || 0;
        if (colCount > 0 && colCount < 3) {
          insights.push({
            type: 'suggestion',
            title: `Streamline workflow in ${p.name}`,
            description: 'Use at least To Do, In Progress, and Done columns for clarity',
            action: 'Optimize team workflow'
          });
        }
        if ((p.tasks?.length || 0) === 0) {
          insights.push({
            type: 'suggestion',
            title: `No tasks in ${p.name}`,
            description: 'Add your first tasks to kickstart the project',
            action: 'Create Task'
          });
        }
      });

      // Portfolio insight
      if (projects.length > 1) {
        insights.push({
          type: 'suggestion',
          title: `Managing ${projects.length} projects`,
          description: 'Review priorities across projects to prevent context switching',
          action: 'Prioritize projects'
        });
      }

      // Productivity insights from focus sessions
      if (sessionStats) {
        const minutes = Math.round((sessionStats.totalFocusTime || 0) / 60);
        if ((sessionStats.totalSessions || 0) === 0) {
          insights.push({
            type: 'suggestion',
            title: 'No focus sessions in the past week',
            description: 'Try a 25-minute session to kickstart momentum',
            action: 'Start Timer'
          });
        } else {
          insights.push({
            type: 'performance',
            title: `${minutes} minutes focused in last 7 days`,
            description: `Avg session ${Math.round((sessionStats.averageSessionLength || 0) / 60)} min • ${sessionStats.completedSessions || 0} completed`,
            action: 'View detailed analytics'
          });
          if ((sessionStats.sessionsToday || 0) === 0) {
            insights.push({
              type: 'suggestion',
              title: 'No focus session today',
              description: 'Schedule a quick session to make progress now',
              action: 'Start Timer'
            });
          }
        }
      }

      // Limit to a concise set
      return insights.slice(0, 7);
    } catch (error) {
      console.error('Error generating insights:', error);
      // Conservative fallback
      return [
        {
          type: 'performance',
          title: 'Check project health',
          description: 'Open analytics to review completion rate and active work',
          action: 'View detailed analytics'
        }
      ];
    }
  }
}
