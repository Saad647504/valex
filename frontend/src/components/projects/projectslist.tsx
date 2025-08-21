'use client';

import { useProjects } from '@/contexts/projectcontext';

interface ProjectsListProps {
  onSelectProject: (projectId: string) => void;
}

export default function ProjectsList({ onSelectProject }: ProjectsListProps) {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No projects yet</div>
        <div className="text-sm text-gray-400">Create your first project to get started</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onSelectProject(project.id)}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4"
          style={{ borderLeftColor: project.color }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded">
                {project.key}
              </span>
            </div>
            
            {project.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Owner: {project.owner.firstName} {project.owner.lastName}</span>
              <span>0 tasks</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}