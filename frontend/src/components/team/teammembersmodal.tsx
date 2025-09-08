import React, { useState, useEffect } from 'react';
import { X, Users, Mail, UserPlus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/authcontext';
import { teamAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/notificationcontext';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
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

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  isProjectManager: boolean;
}

export default function TeamMembersModal({ isOpen, onClose, projectId, isProjectManager }: TeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const { user } = useAuth();
  const { error: notifyError, success: notifySuccess } = useNotifications();
  const [removeState, setRemoveState] = useState<{ id: string, name: string } | null>(null);

  const loadMembers = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const response = await teamAPI.getMembers(projectId);
      setMembers(response.members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [isOpen, projectId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      await teamAPI.sendInvitation(projectId, {
        email: inviteEmail.trim(),
        role: inviteRole as 'MEMBER' | 'ADMIN' | 'VIEWER'
      });
      
      setInviteSent(true);
      setTimeout(() => {
        setInviteEmail('');
        setInviteRole('MEMBER');
        setInviteSent(false);
      }, 2000);
      
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      notifyError('Invite Failed', error.response?.data?.error || 'Failed to invite member', { variant: 'center', duration: 2600 });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveState({ id: memberId, name: memberName });
  };
  const confirmRemove = async () => {
    if (!removeState) return;
    try {
      await teamAPI.removeMember(projectId, removeState.id);
      await loadMembers();
      notifySuccess('Member Removed', `${removeState.name} removed from project`, { variant: 'center', duration: 2200 });
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      notifyError('Remove Failed', error.response?.data?.error || 'Failed to remove member', { variant: 'center', duration: 2600 });
    } finally {
      setRemoveState(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl text-white">Team Members</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isProjectManager && (
          <div className="p-6 border-b border-slate-700 bg-slate-800/50">
            <h3 className="text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite New Member
            </h3>
            <form onSubmit={handleInvite} className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={inviteLoading}
                className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
                  inviteSent ? 'bg-green-600' : 'bg-cyan-600 hover:bg-cyan-700'
                } disabled:opacity-50`}
              >
                {inviteLoading ? (
                  <>Loading...</>
                ) : inviteSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Invited!
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm">
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </div>
                    <div>
                      <div className="text-white text-sm">
                        {member.user.firstName} {member.user.lastName}
                        {member.user.id === user?.id && <span className="text-green-400 ml-2">(You)</span>}
                      </div>
                      <div className="text-slate-400 text-xs">{member.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                      {member.role.toLowerCase()}
                    </span>
                    {isProjectManager && member.role !== 'OWNER' && member.user.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id, `${member.user.firstName} ${member.user.lastName}`)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {members.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400">No team members yet</div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
      {/* Remove Member Confirmation */}
      <AnimatePresence>
        {removeState && (
          <>
            <motion.div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRemoveState(null)} />
            <motion.div className="fixed inset-0 z-[70] flex items-center justify-center px-4" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-black/70 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-6">
                <div className="text-white text-lg font-medium mb-1">Remove Member?</div>
                <div className="text-slate-300 text-sm">Are you sure you want to remove {removeState.name} from this project?</div>
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
