'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Folder, Users, Calendar, Settings, Trash2 } from 'lucide-react';
import GithubBadge from '@/components/integrations/githubbadge';
import { Josefin_Sans } from 'next/font/google';
import { useAuth } from '@/contexts/authcontext';
import { projectAPI } from '@/lib/api';
import CreateProjectModal from './createprojectmodal';
import { useNotifications } from '@/contexts/notificationcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface Project {
  id: string;
  name: string;
  description?: string;
  key: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  ownerId: string;
  owner?: {
    firstName: string;
    lastName: string;
  };
  members?: any[];
  _count?: {
    tasks: number;
    members: number;
  };
}

interface ProjectsDashboardProps {
  onBack?: () => void;
  onNavigate?: (view: string, projectId?: string) => void;
}

export default function ProjectsDashboard({ onBack, onNavigate }: ProjectsDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const { error: notifyError } = useNotifications();
  const [deleteState, setDeleteState] = useState<{ id: string; name: string } | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  const handleProjectCreated = () => {
    loadProjects();
  };

  const handleOpenProject = (project: Project) => {
    onNavigate?.('kanban', project.id);
  };

  const handleDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteState({ id: project.id, name: project.name });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOwner = (project: Project) => {
    return project.ownerId === user?.id;
  };

  // Logged-out experience: prompt to sign in
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
            <div>
              <h1 className="text-2xl font-light text-white">Projects</h1>
            </div>
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <Folder className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">Projects</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to access your project workspace, create projects, and collaborate with your team.
              </p>
              <button
                onClick={() => onNavigate?.('login')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Manage Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
          <div>
            <h1 className="text-2xl font-light text-white">Projects</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <GithubBadge />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            
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
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-400">Loading projects...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 text-lg font-medium mb-2">No Projects Yet</h3>
              <p className="text-slate-500 mb-6">
                Create your first project to start organizing your work
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all hover:scale-105 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </button>
            </div>
          )}

          {/* Projects Grid */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all cursor-pointer"
                  onClick={() => handleOpenProject(project)}
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: project.color + '20', border: `1px solid ${project.color}40` }}
                      >
                        <Folder 
                          className="w-5 h-5" 
                          style={{ color: project.color }} 
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{project.name}</h3>
                        <p className="text-slate-400 text-sm">{project.key}</p>
                      </div>
                    </div>
                    
                    {isOwner(project) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDeleteProject(project, e)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Project Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{(project._count?.members || 0) + 1} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {isOwner(project) ? 'You own this project' : `Owned by ${project.owner?.firstName} ${project.owner?.lastName}`}
                    </div>
                    
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Project Confirmation */}
      <AnimatePresence>
        {deleteState && (
          <>
            <motion.div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteState(null)} />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} onKeyDown={(e) => { if (e.key === 'Escape') setDeleteState(null); }} tabIndex={-1}>
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="text-white text-lg font-medium mb-1">Delete Project?</div>
                <div className="text-slate-300 text-sm">“{deleteState.name}” and its data will be permanently removed. This cannot be undone.</div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setDeleteState(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10">Cancel</button>
                  <button onClick={async () => {
                    if (!deleteState) return;
                    try {
                      await projectAPI.deleteProject(deleteState.id);
                      setDeleteState(null);
                      await loadProjects();
                    } catch (e: any) {
                      notifyError('Delete Failed', e?.body?.error || 'Could not delete project', { variant: 'center', duration: 2600 });
                    }
                  }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white border border-red-500/30">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
