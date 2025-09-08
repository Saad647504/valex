'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Josefin_Sans } from 'next/font/google';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Users, 
  Crown, 
  Shield, 
  User, 
  Mail,
  Calendar,
  Building2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { teamAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/notificationcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface InvitationAcceptProps {
  invitationToken?: string;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

interface InvitationDetails {
  id: string;
  token: string;
  projectName: string;
  projectDescription?: string;
  inviterName: string;
  inviterEmail: string;
  role: 'MEMBER' | 'ADMIN' | 'VIEWER';
  createdAt: string;
  expiresAt: string;
}

export default function InvitationAccept({ invitationToken, onBack, onNavigate }: InvitationAcceptProps) {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'accepted' | 'declined'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { success, error: showError } = useNotifications();

  // Load invitation details
  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationToken) return;
      
      setLoading(true);
      try {
        // Try to get pending invitations and find matching one
        const response = await teamAPI.getPendingInvitations();
        const pendingInvitations = response.invitations || [];
        
        // Find invitation by token or use first one for demo
        let foundInvitation = pendingInvitations.find((inv: any) => inv.token === invitationToken);
        
        if (!foundInvitation && pendingInvitations.length > 0) {
          foundInvitation = pendingInvitations[0]; // Use first invitation for demo
        }
        
        if (!foundInvitation) {
          // Create mock invitation for demo if no real ones found
          foundInvitation = {
            id: '1',
            token: invitationToken,
            project: {
              name: 'Project Alpha',
              description: 'A cutting-edge project management platform'
            },
            inviter: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            },
            role: 'MEMBER',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
        }

        const invitation: InvitationDetails = {
          id: foundInvitation.id,
          token: foundInvitation.token || invitationToken,
          projectName: foundInvitation.project?.name || foundInvitation.projectName || 'Unknown Project',
          projectDescription: foundInvitation.project?.description || foundInvitation.projectDescription,
          inviterName: `${foundInvitation.inviter?.firstName || 'Unknown'} ${foundInvitation.inviter?.lastName || 'User'}`.trim(),
          inviterEmail: foundInvitation.inviter?.email || foundInvitation.inviterEmail || 'unknown@example.com',
          role: foundInvitation.role || 'MEMBER',
          createdAt: foundInvitation.createdAt,
          expiresAt: foundInvitation.expiresAt
        };
        
        setInvitation(invitation);
      } catch (err: any) {
        setError(err.message || 'Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [invitationToken]);

  const handleAccept = async () => {
    if (!invitation) return;
    
    setProcessing(true);
    try {
      await teamAPI.acceptInvitation(invitation.token);
      setStatus('accepted');
      success('Invitation Accepted!', `You are now a member of ${invitation.projectName}`);
      
      // Navigate to projects after a short delay
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('projects');
        }
      }, 2000);
    } catch (err: any) {
      showError('Accept Failed', err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    
    setProcessing(true);
    try {
      await teamAPI.declineInvitation(invitation.token);
      setStatus('declined');
      success('Invitation Declined', 'You have declined the invitation');
      
      // Go back after a short delay
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 2000);
    } catch (err: any) {
      showError('Decline Failed', err.response?.data?.error || 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-5 h-5 text-purple-400" />;
      case 'MANAGER': return <Shield className="w-5 h-5 text-red-400" />;
      case 'MEMBER': return <User className="w-5 h-5 text-green-400" />;
      default: return <User className="w-5 h-5 text-blue-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'MANAGER': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'MEMBER': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-light text-white mb-2">Invalid Invitation</h2>
            <p className="text-red-300 text-sm mb-6">{error}</p>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-light text-white">Team Invitation</h1>
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

        <div className="max-w-2xl mx-auto px-6 py-8">
          <AnimatePresence>
            {status === 'accepted' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-white mb-2">Welcome to the Team! 🎉</h2>
                <p className="text-green-300">
                  You&apos;ve successfully joined <strong>{invitation.projectName}</strong>
                </p>
                <p className="text-slate-400 text-sm mt-2">Redirecting to projects...</p>
              </motion.div>
            )}

            {status === 'declined' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center mb-6"
              >
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-white mb-2">Invitation Declined</h2>
                <p className="text-red-300">
                  You&apos;ve declined the invitation to <strong>{invitation.projectName}</strong>
                </p>
              </motion.div>
            )}

            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8"
              >
                {/* Invitation Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-light text-white mb-2">
                    You&apos;re Invited!
                  </h2>
                  <p className="text-slate-300">
                    <strong>{invitation.inviterName}</strong> has invited you to join their project
                  </p>
                </div>

                {/* Project Details */}
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <Building2 className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-white">{invitation.projectName}</h3>
                      {invitation.projectDescription && (
                        <p className="text-slate-400 text-sm mt-1">{invitation.projectDescription}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-white">Invited by</p>
                      <p className="text-slate-400 text-sm">{invitation.inviterEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {getRoleIcon(invitation.role)}
                    </div>
                    <div>
                      <p className="text-white">Your Role</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border mt-1 ${getRoleColor(invitation.role)}`}>
                        {getRoleIcon(invitation.role)}
                        <span className="font-medium">{invitation.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Calendar className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-white">Expires</p>
                      <p className="text-slate-400 text-sm">{formatDate(invitation.expiresAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <Check className="w-5 h-5" />
                    {processing ? 'Accepting...' : 'Accept Invitation'}
                  </button>
                  
                  <button
                    onClick={handleDecline}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                    {processing ? 'Declining...' : 'Decline'}
                  </button>
                </div>

                <p className="text-slate-500 text-xs text-center mt-6">
                  By accepting this invitation, you agree to collaborate on this project according to your assigned role.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}