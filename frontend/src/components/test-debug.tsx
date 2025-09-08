'use client';

import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';

export default function TestDebug() {
  const { user } = useAuth();
  const { projects, currentProject, loading } = useProjects();
  
  console.log('TestDebug - Raw state:', {
    user,
    projects,
    currentProject,
    loading,
    projectsLength: projects.length
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h1>Debug Component</h1>
      <div>
        <h2>Auth State:</h2>
        <pre>{JSON.stringify({ user: user ? { email: user.email, id: user.id } : null }, null, 2)}</pre>
      </div>
      <div>
        <h2>Project State:</h2>
        <pre>{JSON.stringify({ 
          loading, 
          projectsCount: projects.length,
          currentProject: currentProject ? { id: currentProject.id, name: currentProject.name } : null 
        }, null, 2)}</pre>
      </div>
      <div>
        <h2>Raw Projects:</h2>
        <pre>{JSON.stringify(projects, null, 2)}</pre>
      </div>
    </div>
  );
}