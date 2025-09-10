'use client';

import { useState, useEffect, useRef } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { ArrowLeft, Send, Bot, User, Sparkles, Clock, Users, Target, TrendingUp, Lightbulb, Zap } from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { useNotifications } from '@/contexts/notificationcontext';
import { aiAPI, projectAPI, sessionAPI } from '@/lib/api';
import { useTimer } from '@/contexts/timercontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface AIAssistantProps {
  onBack?: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: unknown;
}


interface Insight {
  type: 'performance' | 'workload' | 'optimization' | 'suggestion';
  title: string;
  description: string;
  action?: string;
}

const QUICK_ACTIONS = [
  { icon: Target, text: "Create a new task", prompt: "Create a task for implementing user authentication with JWT tokens" },
  { icon: Users, text: "Analyze team workload", prompt: "How is the team's current workload distributed?" },
  { icon: TrendingUp, text: "Project optimization", prompt: "What optimizations can improve our project velocity?" },
  { icon: Lightbulb, text: "Generate task ideas", prompt: "Suggest 5 tasks for improving our codebase quality" }
];


// Domain badge removed per request


export default function AIAssistant({ onBack }: AIAssistantProps) {
  const { user } = useAuth();
  const { projects, currentProject, loadProject, createTask } = useProjects();
  const { success, error: notifyError, info } = useNotifications();
  const { selectedTask, state: timerState, timeLeft } = useTimer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'insights' | 'suggestions'>('chat');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionTargetProjectId, setSuggestionTargetProjectId] = useState<string | undefined>(currentProject?.id || projects?.[0]?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    const welcomeMessage: Message = {
      id: '1',
      type: 'system',
      content: `Hey ${user?.firstName || 'there'}! 👋 I'm your AI productivity assistant. I can help you:\n\n✨ Break down complex tasks into manageable steps\n🎯 Generate project ideas and task suggestions\n📊 Analyze your workflow and provide insights\n⚡ Optimize your productivity patterns\n\nWhat would you like to work on today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Load insights when switching to insights tab
  useEffect(() => {
    if (activeView === 'insights' && user && insights.length === 0) {
      loadInsights();
    }
  }, [activeView, user]);

  // Load suggestions when switching to suggestions tab
  useEffect(() => {
    if (activeView === 'suggestions' && user && suggestions.length === 0) {
      generateSuggestions();
    }
  }, [activeView, user]);

  const loadInsights = async () => {
    if (!user) return;
    
    setLoadingInsights(true);
    try {
      const response = await aiAPI.getInsights();
      setInsights(response.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
      // Fallback insights for new users
      setInsights([
        {
          type: 'suggestion',
          title: 'Welcome to AI Insights! 🎯',
          description: 'Start your productivity journey by creating your first project. I recommend beginning with a simple project structure.',
          action: 'Create Project'
        },
        {
          type: 'optimization',
          title: 'Focus Sessions Boost Productivity',
          description: 'Use the Pomodoro timer to maintain focus. Research shows 25-minute focused sessions increase productivity by 40%.',
          action: 'Start Timer'
        },
        {
          type: 'workload',
          title: 'Task Management Best Practices',
          description: 'Break large tasks into smaller, manageable chunks. Aim for tasks that take 1-4 hours to maintain momentum.',
          action: 'Learn More'
        },
        {
          type: 'performance',
          title: 'Smart Collaboration',
          description: 'Invite team members to collaborate. Teams using shared project management see 25% faster completion rates.',
          action: 'Invite Team'
        },
        {
          type: 'suggestion',
          title: 'AI-Powered Task Creation',
          description: 'I can help generate task breakdowns, estimate time requirements, and suggest optimal task sequences.',
          action: 'Try Now'
        }
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Create a task directly from a suggestion into the selected project
  const handleCreateSuggestedTask = async (title: string) => {
    try {
      if (!user) return;
      if (!suggestionTargetProjectId) {
        // No project context; fall back to chat to create
        setInput(`Create a task: ${title}`);
        setActiveView('chat');
        return;
      }

      // Ensure project with columns is available
      let columns: any[] = [];
      if (currentProject && currentProject.id === suggestionTargetProjectId && currentProject.columns?.length) {
        columns = currentProject.columns as any[];
      } else {
        try {
          const pr = await projectAPI.getProject(suggestionTargetProjectId);
          columns = pr.project?.columns || [];
        } catch {}
      }

      // Find target column: prefer default, else first
      const defaultCol = columns.find(c => (c as any).isDefault) || columns?.[0];
      if (!defaultCol) {
        notifyError('No Columns Found', 'Open the project board to create a column first.');
        return;
      }

      // Ask AI to analyze the suggested task for better estimates/context
      let estimatedMinutes = 60;
      try {
        const analysis = await aiAPI.analyzeTask(title, `AI suggestion for project ${suggestionTargetProjectId}`, suggestionTargetProjectId);
        if (analysis?.analysis?.estimatedHours) {
          const hours = analysis.analysis.estimatedHours;
          if (Number.isFinite(hours)) {
            estimatedMinutes = Math.max(15, Math.round(hours * 60));
          }
        }
      } catch (e) {
        // Fallback to default estimate
      }

      await createTask({
        title,
        description: `Created from AI suggestion tailored to this project's goals. Suggestion: ${title}`,
        projectId: suggestionTargetProjectId,
        columnId: defaultCol.id,
        priority: 'MEDIUM',
        estimatedMinutes
      } as any);

      success('Task Created', `"${title}" added to project`);
      info('Tip', 'Open the board to adjust details or start a focus session.');
    } catch (e: any) {
      console.error('AI create task from suggestion failed:', e);
      notifyError('Failed to Create Task', e?.message || 'Please try again.');
    }
  };

  // Get comprehensive user context for AI
  const getUserFullContext = async () => {
    try {
      const projectsResponse = await projectAPI.getProjects();
      const projects = projectsResponse.projects || [];
      const totalTasks = projects.reduce((sum: number, p: any) => sum + (p.tasks?.length || 0), 0);
      // Focus session stats (7d)
      const statsResp = await sessionAPI.getStats('7d');
      const stats = statsResp.stats || {};

      // Working project snapshot
      const workingProjectId = suggestionTargetProjectId || currentProject?.id || projects?.[0]?.id;
      let workingProject: any = null;
      if (workingProjectId) {
        try {
          const pr = await projectAPI.getProject(workingProjectId);
          const p = pr.project;
          const all = p.columns?.flatMap((c: any) => c.tasks || []) || [];
          const done = all.filter((t: any) => t.status === 'DONE').length;
          const progress = all.filter((t: any) => t.status === 'IN_PROGRESS').length;
          const todo = all.filter((t: any) => t.status === 'TODO').length;
          const overdue = all.filter((t: any) => t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
          const unassigned = all.filter((t: any) => !t.assignee && t.status !== 'DONE').length;
          workingProject = {
            id: p.id,
            name: p.name,
            key: p.key,
            description: p.description,
            counts: { total: all.length, done, progress, todo, overdue, unassigned },
            sampleTasks: all.slice(0, 10).map((t: any) => ({ title: t.title, status: t.status, priority: t.priority }))
          };
        } catch {}
      }
      
      return {
        user: {
          name: `${user?.firstName} ${user?.lastName}`,
          role: user?.role || 'User',
          email: user?.email
        },
        projects: {
          count: projects?.length || 0,
          list: projects.map((p: any) => ({
            name: p.name,
            key: p.key,
            taskCount: p.tasks?.length || 0,
            description: p.description
          }))
        },
        currentActivity: `Using AI Assistant (Active tab: ${activeView})`,
        totalTasks,
        productivity: {
          totalSessions: stats.totalSessions,
          completedSessions: stats.completedSessions,
          totalFocusMinutes: Math.round((stats.totalFocusTime || 0) / 60),
          averageSessionMinutes: Math.round((stats.averageSessionLength || 0) / 60),
          sessionsToday: stats.sessionsToday
        },
        activeTask: selectedTask ? {
          title: selectedTask.title,
          projectId: selectedTask.projectId,
          estimatedMinutes: selectedTask.estimatedMinutes,
          timerState,
          timeLeft
        } : null,
        workingProject,
        timestamp: new Date().toISOString(),
        location: 'AI Assistant Interface'
      };
      
    } catch (error) {
      return {
        user: { name: user?.firstName || 'User' },
        currentActivity: 'Using AI Assistant',
        error: 'Limited context due to API error'
      };
    }
  };

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('create') && lowerMessage.includes('task')) {
      return `I'll help you create that task. Based on your request, I suggest:\n\n**Task: User Authentication Implementation**\n- Priority: HIGH\n- Estimated: 6-8 hours\n- Best assignee: John (has JWT experience)\n- Tags: security, backend, auth\n\nShall I create this task with these details?`;
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('workload')) {
      return `Current team analysis:\n\n**Sarah Wilson** - 85% capacity (20h/24h)\n**John Doe** - 110% capacity (26h/24h) ⚠️\n**Mike Chen** - 60% capacity (14h/24h)\n\nRecommendation: Redistribute 2 tasks from John to Mike for better balance.`;
    }
    
    if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
      return `Here are 3 optimization opportunities:\n\n1. **Automate testing** - Save 4h/week\n2. **Parallelize API tasks** - Reduce bottlenecks\n3. **Code review workflow** - Faster merge cycles\n\nImplementing these could increase velocity by 18%.`;
    }
    
    if (lowerMessage.includes('suggest') || lowerMessage.includes('ideas')) {
      return `Task suggestions for your project:\n\n1. **API Rate Limiting** (4h, Medium)\n2. **Error Monitoring Setup** (3h, High)\n3. **Database Optimization** (6h, Medium)\n4. **User Onboarding Flow** (8h, High)\n5. **Mobile Responsive Design** (12h, Medium)\n\nWhich would you like me to create first?`;
    }
    
    return `I understand you're asking about "${userMessage}". I can help with task creation, team analysis, project optimization, and workflow suggestions. Try asking me to create a task or analyze team performance.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Get comprehensive user context
      const context = await getUserFullContext();
      
      // Call the real AI API with full context
      const response = await aiAPI.chat(currentInput, context);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp),
        data: { suggestions: response.suggestions }
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      // Fallback to mock response on error
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: simulateAIResponse(currentInput),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (!user || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get comprehensive user context
      const context = await getUserFullContext();
      
      // Call the real AI API with full context
      const response = await aiAPI.chat(prompt, context);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp),
        data: { suggestions: response.suggestions }
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      // Fallback to mock response on error
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: simulateAIResponse(prompt),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInsightAction = async (action: string) => {
    setIsTyping(true);
    
    // Use AI to provide intelligent action handling
    try {
      const context = await getUserFullContext();
      const response = await aiAPI.chat(`Please help me with this action: ${action}. Provide specific recommendations based on my current project data.`, context);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp)
      };
      
      setMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('Error handling insight action:', error);
      
      // Fallback response based on action type
      let fallbackResponse = '';
      
      switch (action) {
        case 'View detailed analytics':
          fallbackResponse = `📊 **Analytics Overview:**\n\nI can help you access detailed analytics for your projects. The analytics dashboard provides insights into:\n\n• Task completion rates and trends\n• Team performance metrics\n• Project velocity tracking\n• Time estimation accuracy\n\nWould you like me to guide you to the analytics section?`;
          break;
          
        case 'Redistribute tasks':
        case 'Optimize team workflow':
          fallbackResponse = `🔄 **Task Management:**\n\nI can help optimize your task distribution by:\n\n• Analyzing current workload across team members\n• Identifying bottlenecks in your workflow\n• Suggesting task reassignments\n• Recommending workflow improvements\n\nLet me know which specific aspect you'd like to focus on.`;
          break;
          
        case 'Prioritize tasks':
        case 'Prioritize projects':
          fallbackResponse = `⚠️ **Priority Management:**\n\nI can assist with prioritization by:\n\n• Analyzing urgent vs important tasks\n• Reviewing project deadlines and dependencies\n• Suggesting priority reordering\n• Creating focused work plans\n\nWhat specific priorities would you like me to help organize?`;
          break;
          
        default:
          fallbackResponse = `🤖 **Action: ${action}**\n\nI'm ready to help you with "${action}". Based on your current projects and tasks, I can provide specific recommendations and actionable steps.\n\nWhat particular aspect would you like me to focus on?`;
      }

      const fallbackMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
    
    setIsTyping(false);
  };

  const generateSuggestions = async () => {
    setLoadingSuggestions(true);
    
    try {
      const context = await getUserFullContext();
      // Build a project-focused context string
      const proj = context.workingProject;
      const projSummary = proj ? `${proj.name} — ${proj.description || 'No description provided'} [${proj.counts.total} tasks: ${proj.counts.todo} todo, ${proj.counts.progress} in-progress, ${proj.counts.done} done, ${proj.counts.overdue} overdue, ${proj.counts.unassigned} unassigned]. Representative tasks: ${
        (proj.sampleTasks || []).map((t: any) => `${t.title} (${t.status.toLowerCase()})`).join('; ').slice(0, 300) || 'N/A'
      }` : 'No active project';
      const productivity = context.productivity ? `Focus minutes last 7d: ${context.productivity.totalFocusMinutes}, sessions: ${context.productivity.totalSessions}, avg: ${context.productivity.averageSessionMinutes}m` : 'No focus data';
      const contextString = `User: ${context.user.name}. Working project: ${projSummary}. ${productivity}. Suggest next most impactful tasks specific to this project.`;
      
      // Use the actual AI API to generate suggestions
      const response = await aiAPI.suggestTasks(contextString);
      
      setSuggestions(response.suggestions || []);
      
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      
      // Adaptive fallback suggestions based on user's activity level
      const userContext = await getUserFullContext();
      const isNewUser = userContext.projects?.count === 0 || userContext.totalTasks === 0;
      
      if (isNewUser) {
        // Beginner suggestions
        setSuggestions([
          "Create your first project",
          "Add a simple task to get started",
          "Set up your workspace preferences", 
          "Create a quick note for your ideas",
          "Explore the dashboard features"
        ]);
      } else {
        // Advanced user suggestions
        setSuggestions([
          "Set up automated task workflows",
          "Implement team collaboration tools", 
          "Create project health monitoring",
          "Add advanced task prioritization",
          "Build comprehensive reporting system"
        ]);
      }
    }
    
    setLoadingSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">AI Assistant</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <Bot className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">AI Assistant</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to access your personal AI assistant for intelligent task creation, team analysis, and project optimization insights.
              </p>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  setTimeout(() => {
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('navigate', { detail: 'login' });
                      window.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Chat with AI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      {/* Header */}
      <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-light"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <div className="h-4 w-px bg-slate-600"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-lg font-light text-white">AI Assistant</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400 font-light">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        
        {/* View Toggle */}
        <div className="flex items-center space-x-1 mb-6 bg-slate-800/40 rounded-lg p-1">
          {[
            { key: 'chat', label: 'Chat', icon: Bot },
            { key: 'insights', label: 'Insights', icon: Sparkles },
            { key: 'suggestions', label: 'Suggestions', icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as 'chat' | 'insights' | 'suggestions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-light transition-all ${
                activeView === key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Chat View */}
        {activeView === 'chat' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Chat Interface */}
            <div className="xl:col-span-3">
            <div className="glass-card-minimal h-[600px] flex flex-col">
                
                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar min-h-0">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex items-start space-x-3 ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-green-400 to-cyan-500' 
                          : message.type === 'system'
                          ? 'bg-gradient-to-r from-lime-400 to-emerald-400'
                          : 'bg-gradient-to-r from-emerald-400 to-green-500'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`max-w-2xl ${
                        message.type === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        <div className={`inline-block p-4 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                            : message.type === 'system'
                            ? 'bg-lime-500/10 text-lime-200 border border-lime-500/20'
                            : 'bg-slate-700/50 text-white border border-slate-600/30'
                        }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-line">
                            {message.content}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-700/50 border border-slate-600/30 rounded-2xl p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className="border-t border-slate-700/30 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me to create tasks, analyze performance, or optimize workflows..."
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isTyping}
                      className="w-12 h-12 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <div className="glass-card-minimal p-4">
                <h3 className="text-sm font-light text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="w-full text-left p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50 transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <action.icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                        <span className="text-sm text-white">{action.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            {/* Current Status */}
              <div className="glass-card-minimal p-4">
                <h3 className="text-sm font-light text-white mb-4">Status</h3>
                {currentProject ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Active (In Progress)</span>
                      <span className="text-sm text-white font-light">
                        {currentProject.columns?.reduce((acc: number, col: any) => acc + (/(progress|doing|active|working|wip)/i.test(col.name) ? col.tasks.length : 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Unassigned</span>
                      <span className="text-sm text-yellow-400 font-light">
                        {currentProject.columns?.reduce((acc: number, col: any) => acc + col.tasks.filter((t: any) => !t.assignee).length, 0) || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Projects</span>
                      <span className="text-sm text-emerald-400 font-light">{projects?.length || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Open a project to see live status</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights View */}
        {activeView === 'insights' && (
          <div className="space-y-6">
            {loadingInsights ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading insights...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(insights || []).map((insight, index) => (
              <div key={index} className="glass-card-minimal p-6 hover:bg-slate-800/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    insight.type === 'performance' ? 'bg-emerald-500/20' :
                    insight.type === 'workload' ? 'bg-emerald-500/20' :
                    insight.type === 'optimization' ? 'bg-cyan-500/20' :
                    'bg-lime-500/20'
                  }`}>
                    {insight.type === 'performance' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                    {insight.type === 'workload' && <Clock className="w-5 h-5 text-emerald-400" />}
                    {insight.type === 'optimization' && <Target className="w-5 h-5 text-cyan-400" />}
                    {insight.type === 'suggestion' && <Lightbulb className="w-5 h-5 text-lime-400" />}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    {insight.type}
                  </div>
                </div>
                
                <h3 className="text-lg font-light text-white mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  {insight.description}
                </p>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestions View */}
        {activeView === 'suggestions' && (
          <div className="space-y-6">
            {/* Target Project Selector */}
            {projects?.length || 0 > 0 && (
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 rounded-md px-3 py-2">
                  <span className="text-xs text-slate-400">Create in:</span>
                  <select
                    value={suggestionTargetProjectId}
                    onChange={(e) => setSuggestionTargetProjectId(e.target.value)}
                    className="bg-transparent text-sm text-white focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Theme filters removed */}
            <div className="text-center py-8">
              <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-2">Smart Suggestions</h2>
              <p className="text-slate-400 mb-6">AI-powered recommendations based on your activity</p>
              <button 
                onClick={generateSuggestions}
                disabled={loadingSuggestions}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loadingSuggestions ? 'Generating...' : 'Generate Suggestions'}
              </button>
            </div>

            {loadingSuggestions && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Analyzing your activity...</p>
              </div>
            )}

            {suggestions.length > 0 && !loadingSuggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(suggestions || []).map((suggestion, index) => (
                  <div key={index} className="glass-card-minimal p-6 hover:bg-slate-800/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide text-right">AI Suggestion</div>
                    </div>
                    
                    <h3 className="text-lg font-light text-white mb-2">
                      {suggestion}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {suggestion.toLowerCase().includes('first') || suggestion.toLowerCase().includes('started') || suggestion.toLowerCase().includes('workspace') ? 
                        'Getting Started • Est: 5-15 min' : 
                        'Priority: MEDIUM • Est: 4-8 hours'}
                    </p>
                    {/* Show target project to avoid confusion */}
                    <div className="text-xs text-slate-500 mb-3">
                      {projects?.length || 0 > 0 && (
                        <>
                          Project:
                          <span className="ml-1 text-slate-300">
                            {projects.find(p => p.id === suggestionTargetProjectId)?.name || 'Select a project'}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleCreateSuggestedTask(suggestion)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-light group-hover:text-cyan-300 transition-colors"
                    >
                      Create Task →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-card-minimal {
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.4);
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}</style>
    </div>
  );
}
