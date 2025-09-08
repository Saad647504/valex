'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sessionAPI, taskAPI } from '@/lib/api';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import TimerWarningModal from '@/components/shared/timerwarningmodal';

interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed' | 'overtime';

interface TimerContextType {
  // Timer State
  selectedTask: Task | null;
  state: TimerState;
  timeLeft: number;
  actualTimeSpent: number;
  currentSessionId: string | null;
  
  // Warning Modal State
  showWarningModal: boolean;
  pendingTask: Task | null;
  pendingAction: 'select' | 'selectAndStart' | null;
  
  // Timer Actions
  selectTask: (task: Task, preserveState?: boolean) => void;
  clearTask: () => void;
  startTimer: () => Promise<void>;
  selectTaskAndStart: (task: Task) => Promise<any>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  markDone: () => Promise<void>;
  resetTimer: () => void;
  
  // Warning Modal Actions
  confirmTaskSwitch: () => Promise<void>;
  cancelTaskSwitch: () => void;
  
  // Utility
  formatTime: (seconds: number) => string;
  checkAndClearDeletedTask: (taskId: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentProject, loadProject } = useProjects();
  
  // Timer State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [actualTimeSpent, setActualTimeSpent] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingTask, setPendingTask] = useState<Task | null>(null);
  const [pendingAction, setPendingAction] = useState<'select' | 'selectAndStart' | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingPromiseRef = useRef<{ resolve?: (value: any) => void; reject?: (reason?: any) => void } | null>(null);

  // Helper function to find column by name (robust aliases)
  const findColumn = (columnName: string) => {
    const needle = columnName.toLowerCase();
    return currentProject?.columns?.find(col => {
      const name = (col.name || '').toLowerCase();
      const normalized = name.replace(/\s|-/g, '');
      if (needle === 'in progress') {
        return (
          name.includes('progress') ||
          name.includes('doing') ||
          name.includes('active') ||
          name.includes('working') ||
          normalized.includes('inprogress') ||
          normalized.includes('wip')
        );
      }
      if (needle === 'done') {
        return (
          name.includes('done') ||
          name.includes('complete') ||
          name.includes('completed') ||
          name.includes('finished') ||
          name.includes('closed')
        );
      }
      if (needle === 'to do') {
        return (
          name.includes('to do') ||
          name.includes('todo') ||
          name.includes('backlog') ||
          name.includes('queue') ||
          name.includes('planned')
        );
      }
      return name.includes(needle);
    });
  };

  // Timer Functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectTask = (task: Task, preserveState = false) => {
    // If timer is running, show warning modal instead of silently ignoring
    if (state === 'running' || state === 'overtime' || state === 'paused') {
      console.log('🎯 MODAL TRIGGER: Timer is running, showing warning modal');
      console.log('🎯 Current task:', selectedTask?.title, 'New task:', task.title);
      setPendingTask(task);
      setPendingAction('select');
      setShowWarningModal(true);
      return;
    }

    // If timer already running for this task, do not reset
    if (selectedTask && selectedTask.id === task.id && (state === 'running' || state === 'overtime' || state === 'paused')) {
      console.log('⏱️ SelectTask: Task already running, not resetting');
      return;
    }

    console.log('⏱️ SelectTask: Selecting task', task.title, 'preserveState:', preserveState);
    setSelectedTask(task);
    setTimeLeft(task.estimatedMinutes * 60);
    setActualTimeSpent(0);
    
    // Only set to idle if we're not preserving state (for auto-start scenarios)
    if (!preserveState) {
      setState('idle');
    }
    console.log('⏱️ SelectTask: State set to', preserveState ? 'preserved' : 'idle');
  };

  const clearTask = () => {
    setSelectedTask(null);
    setTimeLeft(0);
    setActualTimeSpent(0);
    setState('idle');
    setCurrentSessionId(null);
  };

  const selectTaskAndStart = async (task: Task) => {
    console.log('⏱️ SelectTaskAndStart: Starting task:', task.title);
    
    // If timer is already running for a different task, show warning modal
    if ((state === 'running' || state === 'overtime' || state === 'paused') && selectedTask && selectedTask.id !== task.id) {
      console.log('⏱️ SelectTaskAndStart: Timer is running for different task, showing warning modal');
      setPendingTask(task);
      setPendingAction('selectAndStart');
      setShowWarningModal(true);
      return new Promise((resolve, reject) => {
        pendingPromiseRef.current = { resolve, reject };
      });
    }
    
    // Set task data
    setSelectedTask(task);
    setTimeLeft(task.estimatedMinutes * 60);
    setActualTimeSpent(0);

    try {
      // Create session
      const sessionResponse = await sessionAPI.startSession({
        duration: task.estimatedMinutes * 60,
        taskId: task.id,
        projectId: task.projectId,
        sessionType: 'FOCUS'
      });

      console.log('⏱️ Session created:', sessionResponse.session.id);
      setCurrentSessionId(sessionResponse.session.id);
      console.log('⏱️ Setting state to running...');
      setState('running');
      return sessionResponse;
    } catch (error) {
      console.error('⏱️ Failed to start session:', error);
      setState('idle');
      throw error;
    }
  };

  const startTimer = async () => {
    if (!selectedTask) {
      console.log('⏱️ StartTimer: No selected task');
      return;
    }
    console.log('⏱️ StartTimer: Starting timer for task:', selectedTask.title);

    try {
      // Create session
      const sessionResponse = await sessionAPI.startSession({
        duration: selectedTask.estimatedMinutes * 60,
        taskId: selectedTask.id,
        projectId: selectedTask.projectId,
        sessionType: 'FOCUS'
      });

      console.log('⏱️ Session created:', sessionResponse.session.id);
      setCurrentSessionId(sessionResponse.session.id);
      console.log('⏱️ Setting state to running...');
      setState('running');

      // Move task to "In Progress" column
      const inProgressColumn = findColumn('In Progress');
      const currentTaskColumn = currentProject?.columns?.find(col => 
        col.tasks.some(task => task.id === selectedTask.id)
      );

      if (inProgressColumn && currentTaskColumn && inProgressColumn.id !== currentTaskColumn.id) {
        try {
          await taskAPI.moveTask(selectedTask.id, {
            columnId: inProgressColumn.id,
            position: inProgressColumn.tasks.length + 1,
            fromColumn: currentTaskColumn.id
          });
          
          // Refresh project to show updated task position
          if (currentProject) {
            loadProject(currentProject.id);
          }
        } catch (error) {
          console.error('Failed to move task to In Progress:', error);
        }
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };

  const pauseTimer = () => {
    setState('paused');
  };

  const resumeTimer = () => {
    setState('running');
  };

  const markDone = async () => {
    if (!selectedTask) return;

    try {
      // Complete the session if one exists
      if (currentSessionId) {
        await sessionAPI.completeSession(currentSessionId, {
          actualDuration: actualTimeSpent,
          notes: ''
        });
      }

      setState('completed');

      // Update task status to DONE and move to Done column
      if (selectedTask && currentProject) {
        const doneColumn = findColumn('Done');
        const currentTaskColumn = currentProject.columns?.find(col => 
          col.tasks.some(task => task.id === selectedTask.id)
        );

        // Update task status first
        await taskAPI.updateTask(selectedTask.id, {
          status: 'DONE',
          completedAt: new Date().toISOString()
        });

        // Then move to done column if needed
        if (doneColumn && currentTaskColumn && doneColumn.id !== currentTaskColumn.id) {
          try {
            await taskAPI.moveTask(selectedTask.id, {
              columnId: doneColumn.id,
              position: doneColumn.tasks.length + 1,
              fromColumn: currentTaskColumn.id
            });
          } catch (error) {
            console.error('Failed to move task to Done column:', error);
          }
        }
        
        // Refresh project to show updated task position
        if (loadProject) {
          loadProject(currentProject.id);
        }
      }

      // Reset timer after a brief delay to show completion state
      setTimeout(() => {
        resetTimer();
      }, 2000);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const resetTimer = () => {
    setState('idle');
    setTimeLeft(selectedTask ? selectedTask.estimatedMinutes * 60 : 0);
    setActualTimeSpent(0);
    setCurrentSessionId(null);
  };

  const checkAndClearDeletedTask = (taskId: string) => {
    if (selectedTask && selectedTask.id === taskId) {
      // If this task is currently selected in the timer, clear it
      console.log('⏱️ Clearing deleted task from timer:', taskId);
      clearTask();
    }
  };

  // Warning Modal Actions
  const confirmTaskSwitch = async () => {
    if (!pendingTask || !pendingAction) return;

    console.log('⏱️ User confirmed task switch');

    // Stop current timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Complete the current session if exists
    if (currentSessionId) {
      try {
        await sessionAPI.completeSession(currentSessionId, {
          actualDuration: actualTimeSpent,
          notes: 'Session interrupted by task switch'
        });
      } catch (error) {
        console.error('Failed to complete interrupted session:', error);
      }
    }

    // Reset timer state
    setState('idle');
    setCurrentSessionId(null);

    // Execute the pending action
    const taskToProcess = pendingTask;
    const actionToProcess = pendingAction;

    // Clear modal state
    setShowWarningModal(false);
    setPendingTask(null);
    setPendingAction(null);

    // Execute the action
    if (actionToProcess === 'select') {
      // Continue with normal selectTask logic
      setSelectedTask(taskToProcess);
      setTimeLeft(taskToProcess.estimatedMinutes * 60);
      setActualTimeSpent(0);
      setState('idle');
    } else if (actionToProcess === 'selectAndStart') {
      // Continue with selectTaskAndStart logic
      setSelectedTask(taskToProcess);
      setTimeLeft(taskToProcess.estimatedMinutes * 60);
      setActualTimeSpent(0);

      try {
        // Create session
        const sessionResponse = await sessionAPI.startSession({
          duration: taskToProcess.estimatedMinutes * 60,
          taskId: taskToProcess.id,
          projectId: taskToProcess.projectId,
          sessionType: 'FOCUS'
        });

        console.log('⏱️ Session created:', sessionResponse.session.id);
        setCurrentSessionId(sessionResponse.session.id);
        setState('running');

        // Resolve the promise if it exists
        if (pendingPromiseRef.current?.resolve) {
          pendingPromiseRef.current.resolve(sessionResponse);
          pendingPromiseRef.current = null;
        }
        
        return sessionResponse;
      } catch (error) {
        console.error('⏱️ Failed to start session:', error);
        setState('idle');
        
        // Reject the promise if it exists
        if (pendingPromiseRef.current?.reject) {
          pendingPromiseRef.current.reject(error);
          pendingPromiseRef.current = null;
        }
        
        throw error;
      }
    }
  };

  const cancelTaskSwitch = () => {
    console.log('⏱️ User cancelled task switch');
    
    // Reject the promise if it exists
    if (pendingPromiseRef.current?.reject) {
      pendingPromiseRef.current.reject(new Error('Task switch cancelled by user'));
      pendingPromiseRef.current = null;
    }

    // Clear modal state
    setShowWarningModal(false);
    setPendingTask(null);
    setPendingAction(null);
  };

  // Timer interval effect
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setActualTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  // Handle overtime
  useEffect(() => {
    if (timeLeft <= 0 && state === 'running') {
      setState('overtime');
    }
  }, [timeLeft, state]);

  // Persist timer state in localStorage
  useEffect(() => {
    if (user && selectedTask) {
      const timerState = {
        selectedTask,
        state,
        timeLeft,
        actualTimeSpent,
        currentSessionId,
        timestamp: Date.now()
      };
      localStorage.setItem(`timer_state_${user.id}`, JSON.stringify(timerState));
    }
  }, [selectedTask, state, timeLeft, actualTimeSpent, currentSessionId, user]);

  // Restore timer state from localStorage
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(`timer_state_${user.id}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          const timeDiff = Math.floor((Date.now() - parsed.timestamp) / 1000);
          
          // Only restore if less than 24 hours old
          if (timeDiff < 86400) {
            setSelectedTask(parsed.selectedTask);
            setState(parsed.state);
            setCurrentSessionId(parsed.currentSessionId);
            
            // Adjust time based on how much time passed
            if (parsed.state === 'running') {
              setTimeLeft(Math.max(0, parsed.timeLeft - timeDiff));
              setActualTimeSpent(parsed.actualTimeSpent + timeDiff);
              // Check if we went into overtime while away
              if (parsed.timeLeft - timeDiff <= 0) {
                setState('overtime');
              }
            } else {
              setTimeLeft(parsed.timeLeft);
              setActualTimeSpent(parsed.actualTimeSpent);
            }
          }
        } catch (error) {
          console.error('Failed to restore timer state:', error);
        }
      }
    }
  }, [user]);

  // Clear timer state on logout
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      // Clear all timer states when user logs out
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('timer_state_')) {
          localStorage.removeItem(key);
        }
      });
      resetTimer();
      setSelectedTask(null);
    }
  }, [user]);

  const value: TimerContextType = {
    selectedTask,
    state,
    timeLeft,
    actualTimeSpent,
    currentSessionId,
    showWarningModal,
    pendingTask,
    pendingAction,
    selectTask,
    clearTask,
    startTimer,
    selectTaskAndStart,
    pauseTimer,
    resumeTimer,
    markDone,
    resetTimer,
    confirmTaskSwitch,
    cancelTaskSwitch,
    formatTime,
    checkAndClearDeletedTask
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
      <TimerWarningModal
        isOpen={showWarningModal}
        currentTaskTitle={selectedTask?.title || 'Unknown Task'}
        newTaskTitle={pendingTask?.title || 'Unknown Task'}
        timeLeft={formatTime(timeLeft)}
        onContinue={cancelTaskSwitch}
        onSwitch={confirmTaskSwitch}
      />
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
