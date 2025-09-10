'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { Clock, ArrowLeft } from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { useTimer } from '@/contexts/timercontext';
import { useNotifications } from '@/contexts/notificationcontext';
import { sessionAPI } from '@/lib/api';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });




interface FocusTimerProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
  projectId?: string;
}


interface FocusStats {
  sessionsToday: number;
  totalTimeToday: number;
  averageSessionLength: number;
  sessionsThisWeek: number;
  productivityScore: number;
  bestFocusTime: string;
  mostProductiveDay: string;
  streak: number;
}

// Helper function to get default time based on priority
const getDefaultTimeByPriority = (priority: string) => {
  switch (priority?.toUpperCase()) {
    case 'URGENT': return 15;
    case 'HIGH': return 30;
    case 'MEDIUM': return 45;
    case 'LOW': return 60;
    default: return 25; // Default 25 minutes (Pomodoro technique)
  }
};

// No mock tasks - only use real project data

export default function FocusTimer({ onBack, onNavigate, projectId }: FocusTimerProps) {
  // Debug removed for production polish
  
  // Handle step-by-step back navigation - just use the existing states
  const handleStepBack = () => {
    console.log('🔙 Current state:', {
      hasSelectedTask: !!selectedTask,
      showProjectSelection,
      hasCurrentProject: !!currentProject,
      showTimerView
    });

    if (showTimerView) {
      // From timer view, go back to task selection without killing context
      console.log('🔙 Hiding timer to return to task selection');
      setShowTimerView(false);
      return;
    }

    if (!showProjectSelection && currentProject) {
      // From task selection, go back to project selection
      console.log('🔙 Going back to project selection');
      setShowProjectSelection(true);
      return;
    }

    // From project selection, exit completely
    console.log('🔙 Exiting focus timer');
    onBack?.();
  };
  
  const { user } = useAuth();
  const { projects, currentProject, loading: projectsLoading, loadProject } = useProjects();
  const { success, error } = useNotifications();
  const {
    selectedTask,
    state,
    timeLeft,
    actualTimeSpent,
    selectTask,
    clearTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    markDone,
    resetTimer,
    formatTime
  } = useTimer();
  
  // Debug removed

  
  const [showProjectSelection, setShowProjectSelection] = useState(!projectId);

  // Auto-hide project selection if projects are loaded and we don't have a specific projectId
  useEffect(() => {
    // Debug removed
    // If we're showing project selection and we have projects now, make sure selection stays visible
    if (showProjectSelection && projects?.length || 0 > 0 && !projectId) {
      console.log('🎯 Projects loaded, keeping selection screen visible');
      // Keep selection screen visible - user needs to choose
    }
  }, [projects?.length || 0, showProjectSelection, projectId]);
  
  // Get real tasks from current project that are assigned to current user
  const projectTasks = currentProject?.columns?.flatMap(column => 
    column.tasks
      .filter(task => !task.assignee || (task.assignee && task.assignee.id === user?.id)) // Show unassigned tasks or tasks assigned to current user
      .map(task => ({
        ...task,
        // Add default estimated time based on priority if missing
        estimatedMinutes: task.estimatedMinutes || getDefaultTimeByPriority(task.priority),
        projectName: currentProject.name,
        projectId: currentProject.id,
        // Map database status values to component status values
        status: task.status === 'TODO' ? 'todo' as const : 
                task.status === 'IN_PROGRESS' ? 'in-progress' as const : 
                task.status === 'DONE' ? 'done' as const : 'todo' as const,
        priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
      }))
  ) || [];
  
  // Only use real project tasks - no mock data
  const activeTasks = projectTasks.filter(task => task.status !== 'done');

  
  const [completedSessions, setCompletedSessions] = useState(0);
  const [focusStreak, setFocusStreak] = useState(7);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [showTaskComplete, setShowTaskComplete] = useState(false);
  const [completedTaskName, setCompletedTaskName] = useState('');
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [showTimerView, setShowTimerView] = useState(false);

  const handleProjectSelect = async (selectedProjectId: string) => {
    // Debug removed
    // Only clear task if timer is not running (don't interfere with active sessions)
    if (state === 'idle') {
      // no-op
      clearTask();
    }
    await loadProject(selectedProjectId);
    
    setShowProjectSelection(false);
    
    // Always show task list first, don't auto-show timer view
    setShowTimerView(false);
  };

  const handleTaskSelect = (task: any) => {
    
    
    // Check if this task is actually running
    const isTaskRunning = selectedTask && selectedTask?.id === task.id && (state === 'running' || state === 'paused' || state === 'overtime');
    
    if (isTaskRunning) {
      // If this task is running, just show the timer view
      setShowTimerView(true);
    } else {
      // Let the timer context handle conflicts with our beautiful modal
      
      
      // Select this task - timer context will show modal if there's a conflict
      selectTask(task);
      setShowTimerView(true);
    }
  };

  
  // Load projects and select first project if none selected
  // Projects are now loaded automatically by ProjectProvider, no need to load here

  // Auto-select project based on prop or first available project
  useEffect(() => {
    
    
    if (projectId && !showProjectSelection && (!currentProject || currentProject.id !== projectId)) {
      // Load specific project if provided and not showing project selection
      
      loadProject(projectId);
    }
  }, [projectId, showProjectSelection, currentProject?.id, loadProject]);

  // Refresh project data when Focus Timer component mounts or returns from other views
  useEffect(() => {
    const refreshProjectData = async () => {
      if (currentProject && !projectsLoading) {
        await loadProject(currentProject.id);
      }
    };

    // Only refresh if we have a current project and it's not loading
    if (currentProject && !projectsLoading) {
      refreshProjectData();
    }
  }, []); // Only run on mount

  // Load user stats when component mounts
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      
      try {
        const response = await sessionAPI.getStats();
        const statsData: FocusStats = {
          sessionsToday: response.stats?.sessionsToday || 0,
          totalTimeToday: response.stats?.totalTimeToday || 0,
          averageSessionLength: response.stats?.averageSessionLength || 25,
          sessionsThisWeek: response.stats?.sessionsThisWeek || 0,
          productivityScore: response.stats?.productivityScore || 87,
          bestFocusTime: response.stats?.bestFocusTime || '10:00 AM - 12:00 PM',
          mostProductiveDay: response.stats?.mostProductiveDay || 'Wednesday',
          streak: response.stats?.streak || 7
        };
        setCompletedSessions(statsData.sessionsToday);
        setFocusStreak(statsData.streak);
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Set default stats on error
        setCompletedSessions(0);
        setFocusStreak(7);
      }
    };

    loadStats();
  }, [user]);
  


  
  
  const handleMarkDone = async () => {
    await markDone();
    setCompletedSessions(prev => prev + 1);
  };


  const addNote = () => {
    if (onNavigate) {
      onNavigate('notes');
    } else {
      setShowNoteModal(true);
    }
  };

  const saveNote = async () => {
    if (!sessionNote.trim() || !selectedTask) return;
    
    try {
      // Create a session note using the notes API
      const { notesAPI } = await import('@/lib/api');
      await notesAPI.createNote({
        title: `Focus Session: ${selectedTask?.title}`,
        content: `Session Note (${Math.floor(actualTimeSpent / 60)}:${String(actualTimeSpent % 60).padStart(2, '0')}):\n\n${sessionNote}`,
        color: '#0891b2',
        tags: ['focus-session', 'productivity', selectedTask?.projectName.toLowerCase().replace(/\s+/g, '-')],
        projectId: selectedTask?.projectId
      });
      
    } catch (error) {
      console.error('Failed to save session note:', error);
    } finally {
      setShowNoteModal(false);
      setSessionNote('');
    }
  };

  const viewAnalytics = () => {
    if (onNavigate) {
      onNavigate('analytics');
    } else {
      error('Navigation Error', 'Analytics navigation is not available in this context');
    }
  };

  const completeTask = async () => {
    if (!selectedTask) {
      error('Cannot Complete Task', 'No task selected');
      return;
    }
    
    // Show task completion UI first
    setCompletedTaskName(selectedTask?.title);
    setShowTaskComplete(true);
    
    try {
      // Use timer context's markDone function for proper flow
      await markDone();
      
      // Show success notification
      success('Task Completed! 🎉', `"${selectedTask?.title}" has been marked as done and moved to your Kanban board`);
      
      // Hide completion UI and return to task selection after delay
      setTimeout(() => {
        setShowTaskComplete(false);
        setCompletedTaskName('');
        setShowTimerView(false);
        // Clear the selected task to return to task selection view
        clearTask();
        // Refresh project data to update task list (completed task will disappear)
        if (currentProject) {
          loadProject(currentProject.id);
        }
      }, 3000);
      
    } catch (err) {
      console.error('❌ Failed to complete task:', err);
      error('Task Completion Failed', 'Failed to complete task. Please try again.');
      setShowTaskComplete(false);
      setCompletedTaskName('');
      setShowTimerView(false);
    }
  };

  // Auto-complete when timer finishes (timeLeft <= 0 and we enter overtime)
  useEffect(() => {
    if (selectedTask && state === 'overtime' && !showTaskComplete && !autoCompleted) {
      // Trigger the same completion flow as manual complete
      setAutoCompleted(true);
      completeTask().finally(() => {
        // Reset guard after a short delay to allow UI to settle
        setTimeout(() => setAutoCompleted(false), 2000);
      });
    }
  }, [state, selectedTask, showTaskComplete]);

  const formatActualTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const progress = selectedTask ? 
    Math.min((actualTimeSpent / (selectedTask?.estimatedMinutes * 60)) * 100, 100) : 0;

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const getEfficiencyColor = () => {
    if (actualTimeSpent === 0) return 'text-slate-400';
    const efficiency = (selectedTask!.estimatedMinutes * 60) / actualTimeSpent;
    if (efficiency >= 1) return 'text-green-400';
    if (efficiency >= 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl font-light text-white">Focus Timer</h1>
              {currentProject && (
                <p className="text-sm text-cyan-400 mt-1">
                  Working on: {currentProject.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {onNavigate && currentProject && (
                <button
                  onClick={() => onNavigate?.('kanban')}
                  className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700/50 text-sm"
                >
                  View Board
                </button>
              )}
              {onBack && (
                <button
                  onClick={handleStepBack}
                  className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
          </div>
          
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <Clock className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">Focus Timer</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to access the Pomodoro timer, track your focus sessions, and boost your productivity.
              </p>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('login');
                  } else if (onBack) {
                    onBack?.();
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Start Timer
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
            <motion.button 
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStepBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-light group"
            >
              <svg className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </motion.button>
            
            <div className="h-4 w-px bg-slate-600/50" />
            
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-light text-white">Focus Timer</h1>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400 font-light">Deep Work Sessions</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-cyan-400 font-light">{focusStreak} day streak</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 bg-slate-800/40 rounded-lg backdrop-blur">
              <div className="flex items-center space-x-1.5 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-300 font-light">{completedSessions} Sessions</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                <span className="text-slate-300 font-light">2h 45m Today</span>
              </div>
            </div>
            
            
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        
        {showProjectSelection ? (
          /* Project Selection Screen */
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-light text-white mb-2">Select a Project</h1>
              <p className="text-slate-400">Choose which project you want to focus on</p>
              {/* Debug info removed for production polish */}
            </div>
            
            <div className="space-y-2">
              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <span className="text-slate-400">Loading projects...</span>
                </div>
              ) : projects?.length || 0 === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-slate-300 font-light text-lg mb-2">No projects yet</div>
                  <div className="text-slate-400 text-sm mb-6">
                    Create your first project to start tracking focus sessions
                  </div>
                  <button 
                    onClick={handleStepBack}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white font-light rounded-lg transition-all duration-150"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <motion.button
                    key={project.id}
                    whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-left hover:border-slate-600/50 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full mt-2" 
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-light group-hover:text-cyan-400 transition-colors text-lg mb-1">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-slate-400 text-sm">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-light text-slate-400">{project.key}</div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        ) : !showTimerView ? (
          /* Task Selection */
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-light text-white mb-2">Focus Session</h1>
              {currentProject ? (
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <span className="text-cyan-400 text-sm font-light">
                    {currentProject.name}
                  </span>
                </div>
              ) : null}
              <p className="text-slate-400">Select a task to begin your focused work session</p>
            </div>
            
            <div className="space-y-2">
              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <span className="text-slate-400">Loading project tasks...</span>
                </div>
              ) : !currentProject ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-slate-300 font-light text-lg mb-2">No projects yet</div>
                  <div className="text-slate-400 text-sm mb-6">
                    Create your first project to start tracking focus sessions
                  </div>
                  <button 
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('projects');
                      } else if (onBack) {
                        onBack?.();
                      } else {
                        window.location.href = '/';
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white font-light rounded-lg transition-all duration-150"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎉</div>
                  <div className="text-slate-300 font-light text-lg mb-2">All tasks completed!</div>
                  <div className="text-slate-400 text-sm">
                    Great job! Check your Kanban board to see completed tasks or create new ones.
                  </div>
                </div>
              ) : (
                activeTasks.map((task) => {
                  const isRunning = selectedTask && selectedTask?.id === task.id && (state === 'running' || state === 'paused' || state === 'overtime');
                  return (
                <motion.button
                  key={task.id}
                  whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                  onClick={() => handleTaskSelect(task)}
                  className={`w-full ${isRunning 
                    ? 'bg-green-900/40 border-green-500/50 shadow-lg shadow-green-500/20' 
                    : 'bg-slate-800/40 border border-slate-700/50'
                  } rounded-xl p-5 text-left hover:border-slate-600/50 transition-all duration-150 group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2.5 ${getPriorityIndicator(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-light text-slate-400 uppercase tracking-wide">
                            {task.projectName}
                          </span>
                        </div>
                        <h3 className="text-white font-light group-hover:text-cyan-400 transition-colors">
                          {task.title}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex items-center gap-2">
                      {isRunning && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-light">Running</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-light text-white">{task.estimatedMinutes}m</div>
                        <div className="text-xs text-slate-500">estimated</div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
              )}
            </div>
          </div>
        ) : (
          /* Timer Interface */
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* Main Timer Area */}
            <div className="col-span-8">
              <div className="glass-card-minimal p-12">
                
                {/* Task Header */}
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${getPriorityIndicator(selectedTask?.priority || 'low')}`} />
                    <span className="text-sm font-light text-slate-400 uppercase tracking-wide">
                      {selectedTask?.projectName}
                    </span>
                  </div>
                  <h2 className="text-xl font-light text-white mb-2">
                    {selectedTask?.title}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {selectedTask?.estimatedMinutes} minute estimate
                  </p>
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center mb-12">
                  
                  {/* Circular Progress */}
                  <div className="relative mb-8">
                    <svg className="w-64 h-64 transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="rgba(148, 163, 184, 0.1)"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke={state === 'overtime' ? 'rgb(239, 68, 68)' : 'rgb(6, 182, 212)'}
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={`${progress * 7.54} 754`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-5xl font-light tracking-wider tabular-nums mb-2 ${
                        state === 'overtime' ? 'text-red-400' : 'text-white'
                      }`}>
                        {state === 'overtime' ? formatTime(-Math.abs(timeLeft)) : formatTime(timeLeft)}
                      </div>
                      {state === 'overtime' && (
                        <div className="text-xs text-red-400 font-light uppercase tracking-wide">
                          Overtime
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {state === 'idle' ? (
                      <button
                        onClick={startTimer}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white font-light rounded-lg transition-all duration-150"
                      >
                        Start Timer
                      </button>
                    ) : state === 'paused' ? (
                      <button
                        onClick={resumeTimer}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white font-light rounded-lg transition-all duration-150"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={pauseTimer}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-light rounded-lg transition-colors duration-150"
                      >
                        Pause
                      </button>
                    )}
                    
                    <button
                      onClick={handleMarkDone}
                      disabled={state === 'idle'}
                      className="px-6 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 disabled:border-slate-600 disabled:text-slate-500 disabled:hover:bg-transparent font-light rounded-lg transition-colors duration-150"
                    >
                      Mark Done
                    </button>
                    
                    <button
                      onClick={resetTimer}
                      className="p-3 text-slate-400 hover:text-slate-200 transition-colors duration-150"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-light text-white">
                      {Math.min(Math.round(progress), 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        progress > 100 ? 'bg-red-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              
              {/* Performance Metrics */}
              <div className="glass-card-minimal p-6">
                <h3 className="font-light text-white mb-4">Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Estimated</span>
                    <span className="text-sm font-light text-white">
                      {selectedTask?.estimatedMinutes}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Elapsed</span>
                    <span className="text-sm font-light text-white">
                      {formatActualTime(actualTimeSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Efficiency</span>
                    <span className={`text-sm font-light ${getEfficiencyColor()}`}>
                      {actualTimeSpent > 0 ? 
                        Math.round(((selectedTask?.estimatedMinutes || 25) * 60 / actualTimeSpent) * 100) + '%' : 
                        '100%'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card-minimal p-6">
                <h3 className="font-light text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Go to project selection from timer view
                      setShowTimerView(false);
                      clearTask();
                      setShowProjectSelection(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors duration-150"
                  >
                    Switch Project
                  </button>
                  <button
                    onClick={() => {
                      // Go back to task selection from timer view
                      clearTask();
                      setShowTimerView(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors duration-150"
                  >
                    Switch Task
                  </button>
                  <button 
                    onClick={addNote}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors duration-150"
                  >
                    Add Note
                  </button>
                  <button 
                    onClick={viewAnalytics}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors duration-150"
                  >
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Today's Stats */}
              <div className="glass-card-minimal p-6">
                <h3 className="font-light text-white mb-4">Today</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-light text-white">{completedSessions}</div>
                    <div className="text-sm text-slate-400">Sessions completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">2h 45m</div>
                    <div className="text-sm text-slate-400">Time focused</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-cyan-400">92%</div>
                    <div className="text-sm text-slate-400">Average efficiency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        <AnimatePresence>
          {state === 'completed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card-minimal p-8 text-center max-w-md mx-4"
              >
                <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                
                <h2 className="text-xl font-light text-white mb-2">Session Complete</h2>
                <p className="text-slate-300 text-sm mb-1">{selectedTask?.title}</p>
                <p className="text-slate-400 text-xs mb-6">
                  Completed in {formatActualTime(actualTimeSpent)}
                  {actualTimeSpent > selectedTask!.estimatedMinutes * 60 && 
                    ` (${Math.round(((actualTimeSpent - selectedTask!.estimatedMinutes * 60) / 60) * 10) / 10}m over)`
                  }
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={completeTask}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white font-light rounded-lg transition-all duration-150"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-light rounded-lg transition-colors duration-150"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Completion Overlay */}
        <AnimatePresence>
          {showTaskComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                className="glass-card-minimal p-8 text-center max-w-md mx-4"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.svg 
                    className="w-10 h-10 text-green-400" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </motion.svg>
                </div>
                
                <motion.h2 
                  className="text-2xl font-light text-white mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Task Completed! 🎉
                </motion.h2>
                
                <motion.p 
                  className="text-slate-300 text-base mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  &quot;{completedTaskName}&quot;
                </motion.p>
                
                <motion.p 
                  className="text-slate-400 text-sm mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Task has been moved to Done in your Kanban board
                </motion.p>

                <motion.div 
                  className="flex items-center justify-center gap-2 text-cyan-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Modal */}
        <AnimatePresence>
          {showNoteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card-minimal p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-lg font-light text-white mb-4">Add Session Note</h3>
                <textarea
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="Add notes about this focus session..."
                  className="w-full h-32 bg-slate-800/50 border border-slate-600/40 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 resize-none text-sm"
                />
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white rounded-lg transition-all text-sm"
                  >
                    Save Note
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        <style jsx>{`
          .glass-card-minimal {
            background: rgba(15, 23, 42, 0.3);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
          }
        `}</style>
      </div>
    </div>
  );
}
