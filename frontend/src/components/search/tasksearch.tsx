'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Tag, User, Clock } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { searchAPI } from '@/lib/api';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

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
      const data = await searchAPI.searchTasks({
        projectId,
        filters: {
          query: query || undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          priority: filters.priority.length > 0 ? filters.priority : undefined,
        },
        page: 1,
        limit: 20,
      });
      setResults(data);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 ${josefinSans.className}`}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-700/30">
            <div>
              <h2 className="text-xl font-light text-white mb-1">Search Tasks</h2>
              <p className="text-slate-400 text-sm">Find tasks across your project</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-slate-700/30">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks, descriptions, or task keys..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl transition-all font-light flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          {results && (
            <div className="p-6 border-b border-slate-700/30 bg-slate-800/30">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-light text-white">Filter Results</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                
                {/* Status Filters */}
                <div>
                  <h5 className="text-xs font-light text-slate-300 mb-3 uppercase tracking-wide">Status</h5>
                  <div className="space-y-2">
                    {results.facets.statuses.map(status => (
                      <label key={status.value} className="flex items-center group cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status.value)}
                            onChange={() => toggleFilter('status', status.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 transition-all ${
                            filters.status.includes(status.value)
                              ? 'bg-cyan-500 border-cyan-500'
                              : 'border-slate-600 group-hover:border-slate-500'
                          }`}>
                            {filters.status.includes(status.value) && (
                              <div className="w-2 h-2 bg-white rounded-sm m-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                          {status.value} <span className="text-slate-500">({status.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filters */}
                <div>
                  <h5 className="text-xs font-light text-slate-300 mb-3 uppercase tracking-wide">Priority</h5>
                  <div className="space-y-2">
                    {results.facets.priorities.map(priority => (
                      <label key={priority.value} className="flex items-center group cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={filters.priority.includes(priority.value)}
                            onChange={() => toggleFilter('priority', priority.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 transition-all ${
                            filters.priority.includes(priority.value)
                              ? 'bg-cyan-500 border-cyan-500'
                              : 'border-slate-600 group-hover:border-slate-500'
                          }`}>
                            {filters.priority.includes(priority.value) && (
                              <div className="w-2 h-2 bg-white rounded-sm m-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                          {priority.value} <span className="text-slate-500">({priority.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="mt-4 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg text-sm font-light border border-slate-600/40 hover:border-slate-500/50 transition-all flex items-center space-x-2"
              >
                <Filter className="w-3 h-3" />
                <span>Apply Filters</span>
              </motion.button>
            </div>
          )}

          {/* Results */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {results && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-light text-white">
                    Found {results.totalCount} tasks
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {results.tasks.map(task => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:bg-slate-800/60 hover:border-slate-600/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-light text-white">{task.title}</h4>
                            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-md border border-cyan-500/30">
                              {task.key}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                              <span>{task.status}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span>{task.priority}</span>
                            </div>
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              <span>{task.column.name}</span>
                            </div>
                            {task._count?.comments > 0 && (
                              <span className="text-slate-400">{task._count.comments} comments</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <div className="text-slate-400 font-light">Searching tasks...</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
