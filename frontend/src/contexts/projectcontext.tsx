'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './authcontext';
import { useSocket } from '@/hooks/usesocket';
import { projectAPI, taskAPI } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string;
  key: string;
  color: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    userId?: string;
    role: string;
  }>;
  columns: Column[];
}

interface Column {
  id: string;
  name: string;
  position: number;
  color: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  key: string;
  status: string;
  priority: string;
  position: number;
  estimatedMinutes?: number;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
}

interface CreateProjectData {
  name: string;
  description: string;
  key: string;
  color: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  projectId: string;
  columnId: string;
  assigneeId?: string;
  priority: string;
  estimatedMinutes?: number;
  useAI?: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const loadingRef = useRef(false);
  const projectLoadingRef = useRef<string | null>(null);
  const { token } = useAuth();
  // Add WebSocket integration - temporarily disabled due to CORS issues
  // const { joinProject, leaveProject, onTaskCreated, onTaskMoved } = useSocket();

  // Listen for real-time task updates - temporarily disabled
  /*
  useEffect(() => {
    const unsubscribeTaskCreated = onTaskCreated((data) => {
      if (currentProject && currentProject.id === data.task.projectId) {
        // Refresh the current project to show new task
        loadProject(currentProject.id);
      }
    });

    const unsubscribeTaskMoved = onTaskMoved((data) => {
      if (currentProject && currentProject.id === data.task.projectId) {
        // Refresh the current project to show moved task
        loadProject(currentProject.id);
      }
    });

    return () => {
      unsubscribeTaskCreated();
      unsubscribeTaskMoved();
    };
  }, [currentProject?.id]);

  // Join project room when viewing a project
  useEffect(() => {
    if (currentProject) {
      joinProject(currentProject.id);
    }
  }, [currentProject?.id]);
  */

  const loadProjects = useCallback(async () => {
    const now = Date.now();
    // Prevent multiple simultaneous calls and add 1 second debounce
    if (!token || loadingRef.current || (now - lastLoadTime < 1000)) return;
    
    loadingRef.current = true;
    setLoading(true);
    setLastLoadTime(now);
    try {
      console.log('📂 Loading projects for user...');
      const response = await projectAPI.getProjects();
      console.log('📂 Projects API response:', response);
      console.log('📂 Number of projects:', response.projects?.length || 0);
      setProjects(response.projects);
      setHasInitialized(true);
      
      // Auto-select first project if none is currently selected
      if (response.projects.length > 0 && !currentProject) {
        const firstProject = response.projects[0];
        setCurrentProject(firstProject);
        // Load the full project details
        const projectResponse = await projectAPI.getProject(firstProject.id);
        setCurrentProject(projectResponse.project);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [token, currentProject]);

  const loadProject = useCallback(async (id: string) => {
    console.log('🔥 loadProject called with:', id, 'token:', !!token, 'currently loading:', projectLoadingRef.current);
    
    if (!token) {
      console.log('❌ No token, returning');
      return;
    }
    
    // Prevent duplicate calls for the same project
    if (projectLoadingRef.current === id) {
      console.log('🔄 Already loading this project, skipping:', id);
      return;
    }
    
    console.log('🚀 Starting to load project:', id);
    projectLoadingRef.current = id;
    setLoading(true);
    
    try {
      console.log('📡 Calling API for project:', id);
      const response = await projectAPI.getProject(id);
      console.log('✅ Project API response:', response);
      console.log('✅ Project loaded successfully:', response.project?.name);
      setCurrentProject(response.project);
    } catch (error) {
      console.error('❌ Failed to load project:', error);
      // Don't set currentProject to null on error, keep existing state
    } finally {
      console.log('🏁 Finally block: clearing loading state');
      projectLoadingRef.current = null;
      setLoading(false);
    }
  }, [token]);

  const createProject = useCallback(async (data: CreateProjectData) => {
    if (!token) return;
    
    try {
      const response = await projectAPI.createProject(data);
      await loadProjects(); // Refresh project list
      return response.project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [token, loadProjects]);

  const createTask = useCallback(async (data: CreateTaskData) => {
    if (!token) {
      console.error('❌ No token available for task creation');
      throw new Error('Authentication required');
    }
    
    try {
      console.log('📝 ProjectContext: Creating task with data:', data);
      const response = await taskAPI.createTask(data as any);
      console.log('✅ ProjectContext: Task created successfully:', response);
      
      // Refresh current project to show new task
      if (currentProject && currentProject.id === data.projectId) {
        console.log('🔄 ProjectContext: Refreshing project to show new task');
        await loadProject(currentProject.id);
      }
      return response.task;
    } catch (error: any) {
      console.error('❌ ProjectContext: Failed to create task:', error);
      console.error('❌ ProjectContext: Error details:', error.message, error.status, error.body);
      throw error;
    }
  }, [token, currentProject, loadProject]);

  // Load projects when user logs in - only once per token
  useEffect(() => {
    if (token && !hasInitialized && !loading) {
      loadProjects();
    }
  }, [token, hasInitialized, loading, loadProjects]); // Only load if not initialized

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      loading,
      loadProjects,
      loadProject,
      createProject,
      createTask
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
