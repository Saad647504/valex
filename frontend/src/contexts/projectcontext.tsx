'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './authcontext';
import { useSocket } from '@/hooks/usesocket';

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
  priority: string;
  useAI?: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const API_BASE = 'http://localhost:5001/api';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  // Add WebSocket integration
  const { joinProject, leaveProject, onTaskCreated, onTaskMoved } = useSocket();

  // Listen for real-time task updates
  useEffect(() => {
    onTaskCreated((data) => {
      if (currentProject && currentProject.id === data.task.projectId) {
        // Refresh the current project to show new task
        loadProject(currentProject.id);
      }
    });

    onTaskMoved((data) => {
      if (currentProject && currentProject.id === data.task.projectId) {
        // Refresh the current project to show moved task
        loadProject(currentProject.id);
      }
    });
  }, [currentProject]);

  // Join project room when viewing a project
  useEffect(() => {
    if (currentProject) {
      joinProject(currentProject.id);
    }
  }, [currentProject]);

  const loadProjects = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/projects`);
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/projects/${id}`);
      setCurrentProject(response.data.project);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (data: CreateProjectData) => {
    if (!token) return;
    
    try {
      const response = await axios.post(`${API_BASE}/projects`, data);
      await loadProjects(); // Refresh project list
      return response.data.project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const createTask = async (data: CreateTaskData) => {
    if (!token) return;
    
    try {
      const response = await axios.post(`${API_BASE}/tasks`, data);
      // Refresh current project to show new task
      if (currentProject) {
        await loadProject(currentProject.id);
      }
      return response.data.task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  // Load projects when user logs in
  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token]);

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