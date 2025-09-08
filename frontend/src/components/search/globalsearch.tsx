'use client';

import { useState, useEffect } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { ArrowLeft, Search, FileText, Users, FolderOpen, Clock, Zap } from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { searchAPI, userAPI } from '@/lib/api';
import UserSearch from './usersearch';
import TaskSearch from './tasksearch';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface GlobalSearchProps {
  onBack?: () => void;
}

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'user' | 'note';
  title: string;
  description?: string;
  subtitle?: string;
  projectName?: string;
}

export default function GlobalSearch({ onBack }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'projects' | 'users' | 'notes'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search query to recent searches
  const saveRecentSearch = (query: string) => {
    if (query.trim().length < 2) return;
    
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // Perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchAPI.search(query, {
        includeProjects: activeTab === 'all' || activeTab === 'projects',
        includeTasks: activeTab === 'all' || activeTab === 'tasks', 
        includeUsers: activeTab === 'all' || activeTab === 'users',
        includeNotes: activeTab === 'all' || activeTab === 'notes'
      });

      // Mock results for demo - replace with actual API response structure
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'task',
          title: 'User Authentication System',
          description: 'Implement JWT authentication with refresh tokens',
          projectName: 'Main Project'
        },
        {
          id: '2', 
          type: 'user',
          title: 'Sarah Wilson',
          subtitle: 'sarah.wilson@company.com',
          description: 'Frontend Developer'
        },
        {
          id: '3',
          type: 'project',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution with React and Node.js'
        },
        {
          id: '4',
          type: 'note',
          title: 'Meeting Notes - Q4 Planning',
          description: 'Discussed roadmap priorities and resource allocation'
        }
      ].filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.description?.toLowerCase().includes(query.toLowerCase());
        const matchesTab = activeTab === 'all' || result.type === activeTab.slice(0, -1);
        return matchesQuery && matchesTab;
      });

      setResults(mockResults);
      saveRecentSearch(query);

    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeTab]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'task': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'project': return <FolderOpen className="w-4 h-4 text-green-400" />;
      case 'user': return <Users className="w-4 h-4 text-purple-400" />;
      case 'note': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getResultBgColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-500/10 border-blue-500/20';
      case 'project': return 'bg-green-500/10 border-green-500/20';
      case 'user': return 'bg-purple-500/10 border-purple-500/20';
      case 'note': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-700/30">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Global Search</h1>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects, people, and notes..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              autoFocus
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'tasks', 'projects', 'users', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-slate-300 font-medium mb-3">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(recent)}
                    className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full text-sm hover:bg-slate-700/50 transition-colors"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-slate-400">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-slate-300 font-medium">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </h3>
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-800/30 transition-colors ${getResultBgColor(result.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{result.title}</h4>
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded capitalize">
                            {result.type}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-slate-400 text-sm mt-1">{result.description}</p>
                        )}
                        {result.subtitle && (
                          <p className="text-slate-500 text-xs mt-1">{result.subtitle}</p>
                        )}
                        {result.projectName && (
                          <p className="text-blue-400 text-xs mt-1">📁 {result.projectName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-slate-300 text-lg font-medium mb-2">No results found</h3>
                <p className="text-slate-500">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-slate-300 text-lg font-medium mb-2">Start searching</h3>
                <p className="text-slate-500">Find tasks, projects, people, and notes across your workspace</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}