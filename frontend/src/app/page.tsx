'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/authcontext';
import { ProjectProvider, useProjects } from '@/contexts/projectcontext';
import LoginForm from '@/components/auth/loginform';
import ProjectsList from '@/components/projects/projectslist';
import KanbanBoard from '@/components/projects/kanbanboard';
import AnalyticsDashboard from '@/components/analytics/analyticsdashboard';

function Dashboard() {
  const [view, setView] = useState<'projects' | 'kanban' | 'analytics'>('projects');
  const { loadProject, currentProject } = useProjects();

  const handleSelectProject = async (projectId: string) => {
    await loadProject(projectId);
    setView('kanban');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('projects')}
            className="text-xl font-semibold text-gray-900 hover:text-gray-600"
          >
            Valex
          </button>
          
          <div className="flex items-center space-x-4">
            {view === 'kanban' && (
              <>
                <button
                  onClick={() => setView('projects')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Projects
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Analytics
                </button>
              </>
            )}
            {view === 'analytics' && (
              <button
                onClick={() => setView('kanban')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Board
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {view === 'projects' && (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">Manage your team's projects and tasks</p>
            </div>
            <ProjectsList onSelectProject={handleSelectProject} />
          </div>
        )}
        
        {view === 'kanban' && <KanbanBoard />}
        
        {view === 'analytics' && currentProject && (
          <AnalyticsDashboard projectId={currentProject.id} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">Valex</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <Dashboard />
      </div>
    </ProjectProvider>
  );
}