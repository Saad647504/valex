'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { Search, Users, UserPlus, Crown, Shield, Zap, User, ArrowLeft, Coffee, Briefcase } from 'lucide-react';
import UserSearch from '@/components/search/usersearch';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { userAPI, teamAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/notificationcontext';
import BackgroundAnimation from '@/components/shared/backgroundanimation';

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

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

function InviteModal({ isOpen, onClose, user }: InviteModalProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const { projects } = useProjects();
  const { user: currentUser } = useAuth();

  // Filter projects where current user is owner or admin
  const ownedProjects = projects.filter(project => 
    project.ownerId === currentUser?.id
  );

  const { success, error } = useNotifications();
  const handleInvite = async () => {
    if (!selectedProject || !user) return;

    setLoading(true);
    try {
      await teamAPI.inviteMember(selectedProject, {
        email: user.email,
        role: selectedRole as 'MEMBER' | 'ADMIN' | 'VIEWER'
      });
      success('Invitation Sent', `Invited ${user.firstName} ${user.lastName}`, { variant: 'center', duration: 2200 });
      onClose();
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      error('Invite Failed', error.response?.data?.error || 'Failed to send invitation', { variant: 'center', duration: 2600 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/40 rounded-xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-white font-medium">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              `${user.firstName[0]}${user.lastName[0]}`
            )}
          </div>
          <div>
            <h3 className="text-lg font-light text-white">
              Invite {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-slate-400">@{user.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-light text-slate-300 mb-2">
              Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:border-cyan-400/60"
            >
              <option value="">Choose a project...</option>
              {ownedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-light text-slate-300 mb-2">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white focus:outline-none focus:border-cyan-400/60"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading || !selectedProject}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-green-600 hover:from-cyan-400 hover:to-green-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Inviting...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Send Invite</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PeopleSearch({ onBack }: { onBack?: () => void }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!user) return;
      
      try {
        const response = await userAPI.getCurrentUser();
        setCurrentUserProfile(response.user);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    loadCurrentUser();
  }, [user]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Could navigate to user profile or show user details
    console.log('Selected user:', user);
  };

  const handleInvite = (user: User) => {
    setSelectedUser(user);
    setShowInviteModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'MANAGER': return <Shield className="w-4 h-4 text-red-400" />;
      case 'MEMBER': return <User className="w-4 h-4 text-green-400" />;
      default: return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">People Search</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <Users className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">People Search</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to search for people, connect with team members, and build your professional network.
              </p>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  setTimeout(() => {
                    // Navigate to login by simulating the navigation
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('navigate', { detail: 'login' });
                      window.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Search People
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-20">
        {/* Header */}
        <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <motion.button 
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-light group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" />
                  <span>Back</span>
                </motion.button>
              )}
              
              <div className="h-4 w-px bg-slate-600/50" />
              
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-lg font-light text-white">People</h1>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400 font-light">Discover & Collaborate</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 font-light">Find teammates</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 bg-slate-800/40 rounded-lg backdrop-blur">
                <div className="flex items-center space-x-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300 font-light">Search Network</span>
                </div>
              </div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto p-6">
          
          {/* User Profile Card */}
          {currentUserProfile && (
            <div className="mb-8">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-white font-medium text-xl">
                    {currentUserProfile.avatar ? (
                      <img 
                        src={currentUserProfile.avatar} 
                        alt={`${currentUserProfile.firstName} ${currentUserProfile.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      `${currentUserProfile.firstName[0]}${currentUserProfile.lastName[0]}`
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h2 className="text-xl font-light text-white">
                        {currentUserProfile.firstName} {currentUserProfile.lastName}
                      </h2>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                        {getRoleIcon(currentUserProfile.role)}
                        <span className="capitalize font-light">{currentUserProfile.role.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      @{currentUserProfile.username} • {currentUserProfile.email}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{currentUserProfile.ownedProjects?.length || 0} projects owned</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{currentUserProfile.projectMembers?.length || 0} collaborations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-light text-white mb-2">Find People</h2>
              <p className="text-slate-400 text-sm">Search by username, name, or email to find teammates and collaborators</p>
            </div>
            
            <UserSearch
              onUserSelect={handleUserSelect}
              onInvite={handleInvite}
              placeholder="Search users by name, username, or email..."
              showInviteButtons={true}
              excludeUserIds={[user.id]}
            />
          </div>

          {/* Search Tips */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-light text-white mb-4 flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-cyan-400" />
              <span>Search Tips</span>
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <strong className="text-white">Find by username:</strong> Search @username or just the username
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <strong className="text-white">Find by name:</strong> Search first name, last name, or full name
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <strong className="text-white">Invite to projects:</strong> Click the invite button to add them to your projects
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <strong className="text-white">Keyboard navigation:</strong> Use ↑↓ arrows, Enter to select, Esc to close
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            user={selectedUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
