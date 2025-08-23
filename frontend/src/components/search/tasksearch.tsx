'use client';

import { useState } from 'react';
import axios from 'axios';

interface SearchResult {
  tasks: any[];
  totalCount: number;
  facets: {
    statuses: Array<{ value: string; count: number }>;
    priorities: Array<{ value: string; count: number }>;
    assignees: Array<{ id: string; name: string; count: number }>;
  };
}

interface TaskSearchProps {
  projectId: string;
  onClose: () => void;
}

export default function TaskSearch({ projectId, onClose }: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[]
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/search/tasks', {
        projectId,
        filters: {
          query: query || undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          priority: filters.priority.length > 0 ? filters.priority : undefined
        },
        page: 1,
        limit: 20
      });
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type: 'status' | 'priority', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Search Tasks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, descriptions, or task keys..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        {results && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Status Filters */}
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <div className="space-y-1">
                  {results.facets.statuses.map(status => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.value)}
                        onChange={() => toggleFilter('status', status.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {status.value} ({status.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <h4 className="font-medium mb-2">Priority</h4>
                <div className="space-y-1">
                  {results.facets.priorities.map(priority => (
                    <label key={priority.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority.value)}
                        onChange={() => toggleFilter('priority', priority.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {priority.value} ({priority.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSearch}
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <h3 className="font-medium mb-3">
              Found {results.totalCount} tasks
            </h3>
            
            <div className="space-y-3">
              {results.tasks.map(task => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {task.key}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Status: {task.status}</span>
                        <span>Priority: {task.priority}</span>
                        {task.assignee && (
                          <span>Assigned: {task.assignee.firstName} {task.assignee.lastName}</span>
                        )}
                        <span>Column: {task.column.name}</span>
                        {task._count.comments > 0 && (
                          <span>{task._count.comments} comments</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-500">Searching...</div>
          </div>
        )}
      </div>
    </div>
  );
}