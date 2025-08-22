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
    const prompt = `
Given this project context: "${projectContext}"
Generate 5 realistic software development tasks that would be needed.
Return as JSON array of task titles.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      return ["Implement user authentication", "Create API endpoints", "Design responsive UI"];
    }
  }
}