'use client';

import { useProjects } from '@/contexts/projectcontext';

export default function KanbanBoard() {
  const { currentProject, loading } = useProjects();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Select a project to view tasks</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
        <p className="text-gray-600">{currentProject.description}</p>
      </div>

      <div className="flex space-x-6 overflow-x-auto h-full">
        {currentProject.columns?.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.name}</h3>
              <span className="text-sm text-gray-500">
                {column.tasks?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {column.tasks?.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{task.key}</span>
                    {task.assignee && (
                      <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {(!column.tasks || column.tasks.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks yet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}