'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Clock, Users } from 'lucide-react';
import { teamAPI } from '@/lib/api';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
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

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await teamAPI.getPendingInvitations();
      setInvitations(response.invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (token: string, action: 'accept' | 'decline') => {
    setProcessingInvites(prev => new Set(prev).add(token));
    
    try {
      if (action === 'accept') {
        await teamAPI.acceptInvitation(token);
      } else {
        await teamAPI.declineInvitation(token);
      }
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.token !== token));
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(token);
        return newSet;
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatExpiresIn = (dateString: string) => {
    const now = new Date();
    const expiresAt = new Date(dateString);
    const diffInHours = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) return 'Expired';
    if (diffInHours < 24) return `${diffInHours}h left`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No pending team invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-slate-700/50">
        <Mail className="w-4 h-4 text-cyan-400" />
        <h3 className="font-medium text-white">Team Invitations</h3>
        <span className="text-xs text-slate-400">({invitations.length})</span>
      </div>

      <AnimatePresence>
        {invitations.map((invitation) => {
          const isProcessing = processingInvites.has(invitation.token);
          const expiresIn = formatExpiresIn(invitation.expiresAt);
          const isExpired = expiresIn === 'Expired';

          return (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mx-4 bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-white">{invitation.project.name}</h4>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                      {invitation.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Invited by {invitation.inviter.firstName} {invitation.inviter.lastName}
                  </p>
                  {invitation.project.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {invitation.project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(invitation.createdAt)}</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                    <Clock className="w-3 h-3" />
                    <span>{expiresIn}</span>
                  </div>
                </div>

                {!isExpired && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleInvitation(invitation.token, 'decline')}
                      disabled={isProcessing}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleInvitation(invitation.token, 'accept')}
                      disabled={isProcessing}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Accept</span>
                    </button>
                  </div>
                )}
              </div>

              {isExpired && (
                <div className="mt-3 text-center">
                  <span className="text-xs text-red-400">This invitation has expired</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}