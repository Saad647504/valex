'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { ArrowLeft, Users, Crown, Shield, User, UserPlus, Search, Check, X } from 'lucide-react';
import { userAPI, teamAPI } from '@/lib/api';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { useNotifications } from '@/contexts/notificationcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

export default function SimplePeopleSearch({ 
  onBack, 
  onNavigate 
}: { 
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [projectMembers, setProjectMembers] = useState<Set<string>>(new Set());
  const [allColleagues, setAllColleagues] = useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { user } = useAuth();
  const { projects } = useProjects();
  const { success, error } = useNotifications();

  // Refresh component data (useful when returning from other screens)
  const refresh = () => {
    // Reload all colleagues across all projects
    loadAllColleagues();
    
    if (selectedProject) {
      loadProjectMembers(selectedProject);
    }
    if (query.trim().length >= 2) {
      searchUsers();
    }
    // Reset invited users state to reflect current reality
    setInvitedUsers(new Set());
  };

  // Auto-refresh when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedProject, query]);

  // Load ALL colleagues across ALL projects
  const loadAllColleagues = async () => {
    if (!projects || projects.length === 0) {
      setAllColleagues(new Set());
      return;
    }

    const colleaguesSet = new Set<string>();
    
    for (const project of projects) {
      try {
        const response = await teamAPI.getMembers(project.id);
        const members = response.members || [];
        
        for (const member of members) {
          const memberUser = member.user || member;
          // Add all team members except current user
          if (memberUser.id && memberUser.id !== user?.id) {
            colleaguesSet.add(memberUser.id);
          }
        }
      } catch (error) {
        console.error(`Failed to load members for project ${project.name}:`, error);
      }
    }
    
    setAllColleagues(colleaguesSet);
  };

  // Load project members when project is selected
  const loadProjectMembers = async (projectId: string) => {
    if (!projectId) {
      setProjectMembers(new Set());
      return;
    }

    setLoadingMembers(true);
    try {
      const response = await teamAPI.getMembers(projectId);
      const memberIds = new Set(response.members?.map((member: any) => member.user?.id || member.userId) || []);
      setProjectMembers(memberIds);
    } catch (error) {
      console.error('Failed to load project members:', error);
      setProjectMembers(new Set());
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load all colleagues when component mounts
  useEffect(() => {
    if (projects && projects.length > 0) {
      loadAllColleagues();
    }
  }, [projects, user]);

  // Load members when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectMembers(selectedProject);
    } else {
      setProjectMembers(new Set());
    }
  }, [selectedProject]);

  const searchUsers = async () => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.searchUsers(query.trim());
      // Filter out current user, ALL colleagues (across all projects), current project members, and invited users
      const filteredUsers = response.users.filter((u: User) => 
        u.id !== user?.id && 
        !allColleagues.has(u.id) && // Exclude ALL colleagues, not just current project members
        !projectMembers.has(u.id) && 
        !invitedUsers.has(u.id)
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (targetUser: User) => {
    if (!selectedProject) {
      error('No Project Selected', 'Please select a project first');
      return;
    }

    try {
      await teamAPI.sendInvitation(selectedProject, {
        email: targetUser.email,
        role: selectedRole as 'MEMBER' | 'ADMIN' | 'VIEWER'
      });
      
      // Mark user as invited
      setInvitedUsers(prev => new Set(prev).add(targetUser.id));
      
      // Remove from current search results
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      
      // Show success notification
      success('Invitation Sent!', `${targetUser.firstName} ${targetUser.lastName} has been invited to join the project`);
    } catch (err: any) {
      console.error('Failed to send invitation:', err);
      error('Invitation Failed', err.response?.data?.error || 'Failed to send invitation');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'MANAGER': return <Shield className="w-4 h-4 text-red-400" />;
      case 'MEMBER': return <User className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  const ownedProjects = projects.filter(project => project.ownerId === user?.id);

  // Show colleagues link
  const ColleaguesInfo = () => (
    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-5 h-5 text-cyan-400" />
        <span className="font-medium text-cyan-400">Team Colleagues</span>
      </div>
      <p className="text-cyan-300 text-sm mb-3">
        You have <strong>{allColleagues.size}</strong> colleagues across all projects. 
        People you're already working with won't appear in search results.
      </p>
      <button
        onClick={() => onNavigate && onNavigate('colleagues')}
        className="text-cyan-400 hover:text-cyan-300 text-sm underline"
      >
        View all colleagues →
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Find People</h1>
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

        {/* Colleagues Info */}
        {allColleagues.size > 0 && <ColleaguesInfo />}

        {/* Project & Role Selection */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Invitation Settings</h3>
          
          {ownedProjects.length === 0 ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No Projects Found</span>
              </div>
              <p className="text-red-300 text-sm mb-3">
                You need to create a project before you can invite people. Go to the Kanban board to create your first project.
              </p>
              <button
                onClick={() => onBack && onBack()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Go to Kanban Board
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Select Project *</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                      !selectedProject ? 'border-yellow-500' : 'border-slate-600'
                    }`}
                  >
                    <option value="">⚠️ Choose a project first...</option>
                    {ownedProjects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  {!selectedProject && (
                    <p className="text-yellow-400 text-xs mt-1">You must select a project to send invitations</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Default Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              
              {!selectedProject && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-4">
                  <p className="text-yellow-300 text-sm">
                    👆 Please select a project above before searching for people to invite
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Search */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Search by name, username, or email..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={searchUsers}
              disabled={loading || query.length < 2 || !selectedProject}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : !selectedProject ? 'Select Project First' : 'Search'}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {users.map(targetUser => (
              <div key={targetUser.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {targetUser.avatar ? (
                      <img src={targetUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      `${targetUser.firstName[0]}${targetUser.lastName[0]}`
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {targetUser.firstName} {targetUser.lastName}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-600 rounded-full text-xs text-slate-300">
                        {getRoleIcon(targetUser.role)}
                        <span>{targetUser.role}</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      @{targetUser.username} • {targetUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => sendInvite(targetUser)}
                  disabled={!selectedProject || invitedUsers.has(targetUser.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    invitedUsers.has(targetUser.id)
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } ${!selectedProject ? 'opacity-50' : ''}`}
                >
                  {invitedUsers.has(targetUser.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Invited
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </>
                  )}
                </button>
              </div>
            ))}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-400">Searching...</p>
              </div>
            )}

            {!loading && users.length === 0 && query.length >= 2 && (
              <div className="text-center py-8 text-slate-400">
                No users found matching "{query}"
              </div>
            )}

            {query.length < 2 && (
              <div className="text-center py-8 text-slate-500">
                Type at least 2 characters to search for users
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}