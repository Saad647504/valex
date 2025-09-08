'use client';

import { useState, useEffect } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { ArrowLeft, Bell, UserPlus, Zap, CheckCircle2, Clock, User, Check, CheckCheck } from 'lucide-react';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import InvitationAccept from '@/components/team/invitationaccept';
import { notificationsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/authcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface NotificationsPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export default function NotificationsPage({ onBack, onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showInviteAccept, setShowInviteAccept] = useState(false);
  const [selectedInviteToken, setSelectedInviteToken] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await notificationsAPI.getNotifications(false, 50);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to demo notifications
      setNotifications([
        {
          id: '1',
          type: 'TEAM_INVITE',
          title: 'Team Invitation',
          message: 'John Doe invited you to join Project Alpha',
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          isRead: false,
          data: { projectId: '1', projectName: 'Project Alpha' }
        },
        {
          id: '2', 
          type: 'AI_INSIGHT',
          title: 'AI Suggestion',
          message: 'AI suggests breaking down your "User Authentication" task into smaller subtasks',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isRead: false,
          data: { taskId: '1' }
        },
        {
          id: '3',
          type: 'TASK_COMPLETED', 
          title: 'Task Completed',
          message: 'Sarah Wilson completed "Database Schema Design"',
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: false,
          data: { taskId: '2', completedBy: 'Sarah Wilson' }
        },
        {
          id: '4',
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: 'Mike Chen assigned "API Integration" to you',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          data: { taskId: '3', assignedBy: 'Mike Chen' }
        },
        {
          id: '5',
          type: 'SESSION_COMPLETED',
          title: 'Focus Session Complete',
          message: 'You completed a 25-minute focus session on backend development',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          data: { duration: 25, sessionType: 'FOCUS' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TEAM_INVITE': return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'AI_INSIGHT': return <Zap className="w-5 h-5 text-purple-400" />;
      case 'TASK_COMPLETED': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'TASK_ASSIGNED': return <User className="w-5 h-5 text-orange-400" />;
      case 'SESSION_COMPLETED': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'TEAM_INVITE': return 'bg-blue-500/10 border-blue-500/20';
      case 'AI_INSIGHT': return 'bg-purple-500/10 border-purple-500/20';
      case 'TASK_COMPLETED': return 'bg-green-500/10 border-green-500/20';
      case 'TASK_ASSIGNED': return 'bg-orange-500/10 border-orange-500/20';
      case 'SESSION_COMPLETED': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleInviteClick = async (notification: any) => {
    // Mark as read and remove from list
    await markAsRead(notification.id);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // Show invitation accept page
    // Backend stores token under data.token
    setSelectedInviteToken(notification.data?.token || notification.id);
    setShowInviteAccept(true);
  };

  const handleBackFromInvite = () => {
    setShowInviteAccept(false);
    setSelectedInviteToken(null);
    // Refresh notifications to see if user is now a member
    fetchNotifications();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Show invitation accept page if needed
  if (showInviteAccept && selectedInviteToken) {
    return (
      <InvitationAccept 
        invitationToken={selectedInviteToken}
        onBack={handleBackFromInvite}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400 text-sm">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-slate-400">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 text-lg font-medium mb-2">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 'No notifications'}
              </h3>
              <p className="text-slate-500">
                {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (notification.type === 'TEAM_INVITE' && !notification.isRead) {
                      handleInviteClick(notification);
                    }
                  }}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.type === 'TEAM_INVITE' && !notification.isRead 
                      ? 'cursor-pointer hover:bg-slate-800/50 hover:border-cyan-400/30' 
                      : 'hover:bg-slate-800/30'
                  } ${
                    getNotificationBgColor(notification.type)
                  } ${!notification.isRead ? 'ring-2 ring-blue-500/20' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium flex items-center gap-2">
                            {notification.title}
                            {notification.type === 'AI_INSIGHT' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30" title="AI Insight" aria-label="AI Insight">
                                <Zap className="w-3 h-3" /> AI
                              </span>
                            )}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                          <p className="text-slate-500 text-xs mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Visual indicator for clickable notifications */}
                      {notification.type === 'TEAM_INVITE' && !notification.isRead && (
                        <div className="flex items-center gap-2 mt-3 text-cyan-400 text-sm">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          Click to view invitation
                        </div>
                      )}
                      {notification.type === 'AI_INSIGHT' && (
                        <button 
                          onClick={() => onNavigate?.('ai')}
                          className="text-purple-400 hover:text-purple-300 text-xs mt-2 underline"
                        >
                          View AI suggestions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
