'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Crown, Shield, User, Eye, MoreVertical, X, Mail, Check } from 'lucide-react';
import { teamAPI } from '@/lib/api';
import { useProjects } from '@/contexts/projectcontext';

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  project: {
    name: string;
    description?: string;
  };
  inviter: {
    firstName: string;
    lastName: string;
  };
}

interface TeamMembersPopoverProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

const roleColors = {
  OWNER: 'text-yellow-400',
  ADMIN: 'text-purple-400',
  MEMBER: 'text-blue-400',
  VIEWER: 'text-gray-400',
};

export default function TeamMembersPopover({ 
  projectId, 
  isOpen, 
  onClose, 
  position 
}: TeamMembersPopoverProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN' | 'VIEWER'>('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const { currentProject } = useProjects();

  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers();
      loadPendingInvitations();
    }
  }, [isOpen, projectId]);

  const loadMembers = async () => {
    try {
      const response = await teamAPI.getMembers(projectId);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const response = await teamAPI.getPendingInvitations();
      // Filter invitations for this project
      const projectInvitations = response.invitations?.filter(
        (inv: Invitation) => inv.project.name === currentProject?.name
      ) || [];
      setInvitations(projectInvitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    try {
      await teamAPI.sendInvitation(projectId, {
        email: inviteEmail,
        role: inviteRole
      });
      
      setInviteEmail('');
      setShowInviteForm(false);
      loadPendingInvitations(); // Reload to show new invitation
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      await teamAPI.updateMemberRole(projectId, memberId, role);
      loadMembers(); // Reload members
      setSelectedMember(null);
      setNewRole('');
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await teamAPI.removeMember(projectId, memberId);
      loadMembers(); // Reload members
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return Icon;
  };

  const getRoleColor = (role: string) => {
    return roleColors[role as keyof typeof roleColors] || 'text-gray-400';
  };

  const canManageMembers = (userRole: string) => {
    return userRole === 'OWNER' || userRole === 'ADMIN';
  };

  const currentUserRole = members.find(m => m.user.id === currentProject?.owner?.id)?.role || 
                          (currentProject?.ownerId === members.find(m => m.id === 'owner')?.user.id ? 'OWNER' : '');

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-50 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl"
          style={{
            top: position.top,
            left: position.left - 320, // Position to left of click
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="font-medium text-white">Team Members</h3>
              <span className="text-xs text-slate-400">({members.length})</span>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">Loading...</div>
            ) : (
              <>
                {/* Members List */}
                <div className="p-4 space-y-3">
                  {members.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    const isOwner = member.role === 'OWNER';
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {member.user.firstName[0]}{member.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="flex items-center space-x-1">
                              <RoleIcon className={`w-3 h-3 ${getRoleColor(member.role)}`} />
                              <span className={`text-xs ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Role Management */}
                        {canManageMembers(currentUserRole) && !isOwner && (
                          <div className="relative">
                            {selectedMember === member.user.id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={newRole || member.role}
                                  onChange={(e) => setNewRole(e.target.value)}
                                  className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="MEMBER">Member</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>
                                <button
                                  onClick={() => updateMemberRole(member.user.id, newRole || member.role)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMember(null);
                                    setNewRole('');
                                  }}
                                  className="text-slate-400 hover:text-slate-300"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedMember(member.user.id);
                                  setNewRole(member.role);
                                }}
                                className="text-slate-400 hover:text-slate-300"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                  <>
                    <div className="border-t border-slate-700/50 px-4 py-2">
                      <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Pending Invitations ({invitations.length})
                      </h4>
                    </div>
                    <div className="px-4 pb-4 space-y-2">
                      {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                              <Mail className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <div className="text-sm text-slate-300">{invitation.email}</div>
                              <div className="text-xs text-slate-500">{invitation.role}</div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">Pending</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Invite Form */}
                {canManageMembers(currentUserRole) && (
                  <div className="border-t border-slate-700/50 p-4">
                    {showInviteForm ? (
                      <div className="space-y-3">
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN' | 'VIEWER')}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <div className="flex space-x-2">
                          <button
                            onClick={sendInvitation}
                            disabled={submitting}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            {submitting ? 'Sending...' : 'Send Invite'}
                          </button>
                          <button
                            onClick={() => {
                              setShowInviteForm(false);
                              setInviteEmail('');
                            }}
                            className="px-3 py-2 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowInviteForm(true)}
                        className="w-full flex items-center justify-center space-x-2 py-2 border border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Invite Member</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}