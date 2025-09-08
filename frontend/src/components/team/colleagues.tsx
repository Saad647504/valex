'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  Shield, 
  User, 
  Search,
  Mail,
  Calendar,
  Building2,
  UserCheck,
  Filter,
  Grid3X3,
  List,
  UserMinus
} from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { teamAPI, projectAPI } from '@/lib/api';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { useNotifications } from '@/contexts/notificationcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface Colleague {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  projects: {
    id: string;
    name: string;
    role: string;
    color: string;
  }[];
  joinedAt: string;
}

export default function Colleagues({ onBack }: { onBack?: () => void }) {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { user } = useAuth();
  const { projects } = useProjects();

  useEffect(() => {
    loadColleagues();
  }, [user, projects]);

  const loadColleagues = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get colleagues from dedicated colleagues API
      const response = await teamAPI.getColleagues();
      const colleagueRelations = response.colleagues || [];
      
      // Transform colleague relations to colleagues with project information
      const colleaguesMap = new Map<string, Colleague>();
      
      for (const relation of colleagueRelations) {
        const colleague = relation.toUser;
        
        // Get all projects where both users are members
        const sharedProjects: any[] = [];
        
        for (const project of projects || []) {
          try {
            const response = await teamAPI.getMembers(project.id);
            const members = response.members || [];
            
            // Check if colleague is a member of this project
            const colleagueMember = members.find((m: any) => 
              (m.user?.id || m.id) === colleague.id
            );
            
            if (colleagueMember) {
              sharedProjects.push({
                id: project.id,
                name: project.name,
                role: colleagueMember.role || 'MEMBER',
                color: project.color || '#3B82F6'
              });
            }
          } catch (error) {
            console.error(`Failed to check project ${project.name} for colleague:`, error);
          }
        }
        
        colleaguesMap.set(colleague.id, {
          id: colleague.id,
          firstName: colleague.firstName,
          lastName: colleague.lastName,
          email: colleague.email,
          avatar: colleague.avatar,
          role: 'MEMBER', // Default role for colleagues
          projects: sharedProjects,
          joinedAt: relation.connectedAt || new Date().toISOString()
        });
      }
      
      setColleagues(Array.from(colleaguesMap.values()));
    } catch (error) {
      console.error('Failed to load colleagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const { success, error } = useNotifications();
  const [removeState, setRemoveState] = useState<{ id: string, name: string } | null>(null);
  const handleRemoveColleague = (colleagueId: string, name?: string) => {
    setRemoveState({ id: colleagueId, name: name || 'this colleague' });
  };
  const confirmRemove = async () => {
    if (!removeState) return;
    try {
      await teamAPI.removeColleague(removeState.id);
      setColleagues(prev => prev.filter(c => c.id !== removeState.id));
      success('Removed', `${removeState.name} has been removed.`, { variant: 'center', duration: 2200 });
    } catch (e: any) {
      error('Failed', e?.response?.data?.error || 'Failed to remove colleague', { variant: 'center', duration: 2600 });
    } finally {
      setRemoveState(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'MANAGER': return <Shield className="w-4 h-4 text-red-400" />;
      case 'MEMBER': return <User className="w-4 h-4 text-green-400" />;
      case 'VIEWER': return <User className="w-4 h-4 text-blue-400" />;
      default: return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'MANAGER': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'MEMBER': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'VIEWER': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter colleagues based on search and role filter
  const filteredColleagues = colleagues.filter(colleague => {
    const matchesSearch = searchQuery === '' || 
      `${colleague.firstName} ${colleague.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colleague.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || colleague.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-light text-white">Team Colleagues</h1>
              <p className="text-slate-400 text-sm">
                {colleagues.length} colleagues across {projects.length} projects
              </p>
            </div>
          </div>
          
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search colleagues by name or email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="MEMBER">Members</option>
              <option value="VIEWER">Viewers</option>
            </select>
            
            <div className="flex bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-400">Loading colleagues...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && colleagues.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Colleagues Yet</h3>
              <p className="text-slate-500">
                Start collaborating by creating projects and inviting team members
              </p>
            </div>
          )}

          {/* No Results */}
          {!loading && colleagues.length > 0 && filteredColleagues.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          {/* Colleagues Grid/List */}
          {!loading && filteredColleagues.length > 0 && (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredColleagues.map((colleague) => (
                <motion.div
                  key={colleague.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all ${
                    viewMode === 'list' ? 'flex items-center gap-6' : ''
                  }`}
                >
                  {/* Avatar and Basic Info */}
                  <div className={`flex items-center gap-4 ${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {colleague.avatar ? (
                        <img src={colleague.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        `${colleague.firstName[0]}${colleague.lastName[0]}`
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">
                          {colleague.firstName} {colleague.lastName}
                        </h3>
                        <UserCheck className="w-4 h-4 text-green-400" title="Colleague" />
                      </div>
                      <p className="text-slate-400 text-sm">{colleague.email}</p>
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">
                        Projects ({colleague.projects.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {colleague.projects.map((project, index) => (
                          <div
                            key={project.id}
                            className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full text-sm"
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="text-slate-300">{project.name}</span>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getRoleColor(project.role)}`}>
                              {getRoleIcon(project.role)}
                              <span>{project.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Member Since and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Colleague since {formatDate(colleague.joinedAt)}</span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveColleague(colleague.id, `${colleague.firstName} ${colleague.lastName}`)}
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove colleague connection"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {removeState && (
          <>
            <motion.div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRemoveState(null)} />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="text-white text-lg font-medium mb-1">Remove Colleague?</div>
                <div className="text-slate-300 text-sm">Are you sure you want to remove {removeState.name}? This will break your professional connection.</div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setRemoveState(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10">Cancel</button>
                  <button onClick={confirmRemove} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white border border-red-500/30">Remove</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
