'use client';
import { Josefin_Sans } from 'next/font/google'
const josefinSans = Josefin_Sans({ subsets: ['latin'] })


import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { notificationsAPI } from '@/lib/api';
import { ChevronDown, User, Settings, LogOut, Bell, UserPlus, Zap, CheckCircle2, Clock, Users } from 'lucide-react';
import desk1 from '../images/deskfinal.png';
import tablet1 from '../images/tabletfinal.png';
import coffee from '../images/coffeecupfinal.png';
import headphones from '../images/headphonesfinal.png';
import stickynote from '../images/stickynotefinal.png';
import notepad from '../images/notepadfinal.png';
import LaptopScreen from '@/components/shared/laptopscreen';
import TeamMembersPopover from '@/components/team/teammemberspopover';

interface DeskSceneProps {
  onNavigate: (view: string) => void;
  isLoggedIn?: boolean;
}

export default function DeskScene({ onNavigate, isLoggedIn = false }: DeskSceneProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTeamPopover, setShowTeamPopover] = useState(false);
  const [teamPopoverPosition, setTeamPopoverPosition] = useState({ top: 0, left: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { currentProject } = useProjects();

  const generateInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoadingNotifications(true);
    try {
      const response = await notificationsAPI.getNotifications(false, 10);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
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
          isRead: false
        },
        {
          id: '2', 
          type: 'AI_INSIGHT',
          title: 'AI Suggestion',
          message: 'AI suggests breaking down your "User Authentication" task into smaller subtasks',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isRead: false
        },
        {
          id: '3',
          type: 'TASK_COMPLETED', 
          title: 'Task Completed',
          message: 'Sarah Wilson completed "Database Schema Design"',
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: false
        },
        {
          id: '4',
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: 'Mike Chen assigned "API Integration" to you',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: true
        }
      ]);
      setUnreadCount(3);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and when user changes
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
      case 'TEAM_INVITE': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'AI_INSIGHT': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'TASK_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'TASK_ASSIGNED': return <User className="w-4 h-4 text-orange-400" />;
      case 'SESSION_COMPLETED': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'TEAM_INVITE': return 'bg-blue-500/20 border-blue-500/30';
      case 'AI_INSIGHT': return 'bg-purple-500/20 border-purple-500/30';
      case 'TASK_COMPLETED': return 'bg-green-500/20 border-green-500/30';
      case 'TASK_ASSIGNED': return 'bg-orange-500/20 border-orange-500/30';
      case 'SESSION_COMPLETED': return 'bg-yellow-500/20 border-yellow-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden ${josefinSans.className}`}>
      {/* Clean desk background */}
      <div 
        className="absolute inset-0" 
        style={{ 
          top: '0px',
          backgroundImage: `url(${desk1.src})`,
          backgroundSize: '100% auto',
          backgroundPosition: 'center 10%'
        }}
      >
      </div>

{/* Minimal Transparent Navigation */}
<div className="absolute top-0 left-0 right-0 z-40">
  <div className="relative px-8 py-6">
    <div className="flex items-center justify-between">
      
      {/* Left - Logo */}
      <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
        VALEX
      </h1>

      {/* Right - Navigation Links & Notifications */}
      <div className="flex items-center gap-8">
        <button onClick={() => onNavigate('people')} className="relative px-2 py-2 text-white font-medium text-sm group">
          People
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-in-out"></span>
        </button>
        <button onClick={() => onNavigate('timer')} className="relative px-2 py-2 text-white font-medium text-sm group">
          Focus
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-in-out"></span>
        </button>
        <button onClick={() => onNavigate('search')} className="relative px-2 py-2 text-white font-medium text-sm group">
          Search
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-in-out"></span>
        </button>
        
        {/* Team Button - Only show if user is logged in and has a current project */}
        {user && currentProject && (
          <button 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTeamPopoverPosition({ 
                top: rect.bottom + window.scrollY + 8, 
                left: rect.left + window.scrollX 
              });
              setShowTeamPopover(!showTeamPopover);
            }}
            className="relative px-2 py-2 text-white font-medium text-sm group flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            Team
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-in-out"></span>
          </button>
        )}
        
        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white hover:text-blue-400 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-slate-700/50">
                <h3 className="text-white font-medium text-sm">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-6 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-blue-400 rounded-full mx-auto mb-2"></div>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div 
                      key={notification.id} 
                      onClick={() => {
                        if (notification.type === 'TEAM_INVITE' && !notification.isRead) {
                          onNavigate('notifications');
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 transition-colors ${index < notifications.length - 1 ? 'border-b border-slate-700/30' : ''} ${!notification.isRead ? 'bg-blue-950/20' : ''} ${
                        notification.type === 'TEAM_INVITE' && !notification.isRead 
                          ? 'cursor-pointer hover:bg-slate-800/50 hover:border-cyan-400/20' 
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 border rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {notification.message}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                          {notification.type === 'TEAM_INVITE' && !notification.isRead && (
                            <div className="flex items-center gap-1 mt-2 text-cyan-400 text-xs">
                              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                              Click to view invitation
                            </div>
                          )}
                          {notification.type === 'AI_INSIGHT' && (
                            <button 
                              onClick={() => onNavigate('ai')}
                              className="text-purple-400 hover:text-purple-300 text-xs mt-1 underline"
                            >
                              View suggestions
                            </button>
                          )}
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-700/50">
                <button 
                  onClick={() => {
                    onNavigate('notifications');
                    setShowNotifications(false);
                  }}
                  className="w-full text-center text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-lg px-4 py-2 text-white transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  generateInitials(user.firstName, user.lastName)
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-slate-400">{user.role}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/90 backdrop-blur-xl border border-slate-600/40 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-slate-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        generateInitials(user.firstName, user.lastName)
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-slate-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all text-left"
                  >
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                </div>
                
                <div className="border-t border-slate-600/30 py-2">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => onNavigate('login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </div>
  </div>
</div>
{/* Laptop screen overlay - positioned over the laptop in desk image */}
<div 
  className="absolute z-30"
  style={{
    top: '22%',
    left: '33.9%',
    width: '30%',  // bigger width
    height: '26.9%', // bigger height
    transform: 'perspective(1000px) rotateX(-10deg)'
  }}
>
  <LaptopScreen />
</div>
{/* Screen glow reflection on keyboard */}
<div 
  className="absolute pointer-events-none"
  style={{
    top: '38%',
    left: '33%',
    width: '32%',
    height: '20%',
    background: 'radial-gradient(ellipse 80% 40% at center top, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.08) 40%, transparent 70%)',
    filter: 'blur(8px)',
    opacity: 0.6
  }}
/>

{/* Ambient screen light on desk surface */}
<div 
  className="absolute pointer-events-none"
  style={{
    top: '25%',
    left: '30%',
    width: '38%',
    height: '35%',
    background: 'radial-gradient(ellipse 60% 80% at center, rgba(6, 182, 212, 0.04) 0%, rgba(59, 130, 246, 0.02) 60%, transparent 100%)',
    filter: 'blur(15px)'
  }}
/>
      {/* Interactive Tablet - Analytics */}
      <motion.div
        className="absolute cursor-pointer z-20"
        style={{
          top: '45%',
          right: '11.5%', 
          width: '290px',
          height: '290px'
        }}
        whileHover={{
          y: -25,
          scale: 1.02,
          transition: { duration: 0.8, ease: [0.23, 1, 0.320, 1] }
        }}
        whileTap={{
          scale: 0.98,
          y: -20,
          transition: { duration: 0.2, ease: [0.23, 1, 0.320, 1] }
        }}
        onMouseEnter={() => setHoveredItem('tablet')}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onNavigate('analytics')}
      >
        <Image
          src={tablet1}
          alt="Analytics Dashboard"
          fill
          className="object-contain transition-all duration-800"
          style={{
            filter: hoveredItem === 'tablet' 
              ? 'drop-shadow(0 25px 50px rgba(0,255,255,0.3)) brightness(105%)'
              : 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))'
          }}
          quality={100}
          unoptimized={true}
        />
      </motion.div>

      {/* Tablet Card - outside any rotation for flat appearance */}
      {hoveredItem === 'tablet' && (
        <div 
          className="fixed w-60 z-50"
          style={{
            top: '65%',
            right: '30%'
          }}
          onMouseEnter={() => setHoveredItem('tablet')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl group"
            style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 text-cyan-400">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
                  </svg>
                </div>
                <h3 className="text-white font-medium text-sm">Analytics Dashboard</h3>
              </div>
              
              <p className="text-white/70 text-xs leading-relaxed mb-3">
                Real-time team insights and performance tracking
              </p>
              
              <div className="flex items-center gap-1 text-cyan-400 text-xs cursor-pointer group-hover:text-cyan-300 transition-colors">
                <span className="relative">
                  View Dashboard
                  <div className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
                </span>
                <div className="w-3 h-3 transform group-hover:translate-x-1 transition-transform">→</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive Coffee - AI Assistant */}
      <motion.div
        className="absolute cursor-pointer z-20"
        style={{
          top: '17%',
          right: '16%',
          width: '150px',
          height: '150px'
        }}
        whileHover={{
          y: -15,
          scale: 1.1,
          transition: { duration: 0.6, ease: [0.23, 1, 0.320, 1] }
        }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setHoveredItem('coffee')}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onNavigate('ai')}
      >
        <Image
          src={coffee}
          alt="AI Assistant"
          fill
          className="object-contain transition-all duration-600"
          style={{
            filter: hoveredItem === 'coffee' 
              ? 'drop-shadow(0 20px 40px rgba(0,255,255,0.4)) drop-shadow(0 40px 20px rgba(0,0,0,0.5))'
              : 'drop-shadow(0 25px 15px rgba(0,0,0,0.4))'
          }}
          quality={100}
          unoptimized={true}
        />
        
        {hoveredItem === 'coffee' && (
          <div 
            className="fixed w-60 z-50"
            style={{
              top: '95%',
              left: '30%'
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl group"
              style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 text-cyan-400">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-medium text-sm">AI Assistant</h3>
                </div>
                
                <p className="text-white/70 text-xs leading-relaxed mb-3">
                  Intelligent task assignment and smart recommendations
                </p>
                
                <div className="flex items-center gap-1 text-cyan-400 text-xs cursor-pointer group-hover:text-cyan-300 transition-colors">
                  <span className="relative">
                    Activate AI
                    <div className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
                  </span>
                  <div className="w-3 h-3 transform group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
{/* Interactive Headphones - Focus Timer */}
<motion.div
  className="absolute cursor-pointer z-20"
  style={{
    top: '14%',
    left: '12%',
    width: '240px',
    height: '240px'
  }}
  initial={{ rotate: 15 }}
  whileHover={{
    y: -12,
    scale: 1.08,
    rotate: 15,
    transition: { duration: 0.6, ease: [0.23, 1, 0.320, 1] }
  }}
  whileTap={{ scale: 0.95, rotate: 15 }}
  onMouseEnter={() => setHoveredItem('headphones')}
  onMouseLeave={() => setHoveredItem(null)}
  onClick={() => onNavigate('timer')}
>
  <Image
    src={headphones}
    alt="Focus Timer"
    fill
    className="object-contain transition-all duration-600"
    style={{
      filter: hoveredItem === 'headphones' 
        ? 'drop-shadow(0 20px 40px rgba(0,255,255,0.4)) drop-shadow(0 35px 18px rgba(0,0,0,0.5))'
        : 'drop-shadow(0 20px 12px rgba(0,0,0,0.4))'
    }}
    quality={100}
    unoptimized={true}
  />
</motion.div>

{/* Headphones Card - Outside rotation */}
{hoveredItem === 'headphones' && (
  <div 
    className="fixed w-60 z-50"
    style={{
      top: '30%',
      left: '29%'
    }}
    onMouseEnter={() => setHoveredItem('headphones')}
    onMouseLeave={() => setHoveredItem(null)}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl group"
      style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 text-cyan-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
          <h3 className="text-white font-medium text-sm">Focus Timer</h3>
        </div>
        
        <p className="text-white/70 text-xs leading-relaxed mb-3">
          Pomodoro sessions and deep work tracking
        </p>
        
        <div className="flex items-center gap-1 text-cyan-400 text-xs cursor-pointer group-hover:text-cyan-300 transition-colors">
          <span className="relative">
            Start Session
            <div className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
          </span>
          <div className="w-3 h-3 transform group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </div>
    </motion.div>
  </div>
)}

{/* Interactive Sticky Notes - Quick Notes */}
<motion.div
  className="absolute cursor-pointer z-20"
  style={{
    top: '83%',
    left: '30%',
    width: '100px',
    height: '100px'
  }}
  whileHover={{
    y: -10,
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.5, ease: [0.23, 1, 0.320, 1] }
  }}
  whileTap={{ scale: 0.9 }}
  onMouseEnter={() => setHoveredItem('sticky')}
  onMouseLeave={() => setHoveredItem(null)}
  onClick={() => onNavigate('notes')}
>
  <Image
    src={stickynote}
    alt="Quick Notes"
    fill
    className="object-contain transition-all duration-500"
    style={{
      filter: hoveredItem === 'sticky' 
        ? 'drop-shadow(0 15px 30px rgba(0,255,255,0.3)) brightness(105%)'
        : 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))'
    }}
    quality={100}
    unoptimized={true}
  />
</motion.div>

{/* Sticky Notes Card - Outside rotation */}
{hoveredItem === 'sticky' && (
  <div 
    className="fixed w-60 z-50"
    style={{
      top: '80%',
      left: '38%'
    }}
    onMouseEnter={() => setHoveredItem('sticky')}
    onMouseLeave={() => setHoveredItem(null)}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl group"
      style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 text-cyan-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
          <h3 className="text-white font-medium text-sm">Quick Notes</h3>
        </div>
        
        <p className="text-white/70 text-xs leading-relaxed mb-3">
          Rapid idea capture and instant reminders
        </p>
        
        <div className="flex items-center gap-1 text-cyan-400 text-xs cursor-pointer group-hover:text-cyan-300 transition-colors">
          <span className="relative">
            Create Note
            <div className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
          </span>
          <div className="w-3 h-3 transform group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </div>
    </motion.div>
  </div>
)}
      {/* Interactive Notepad - Kanban Board */}
      <motion.div
        className="absolute cursor-pointer z-20"
        style={{
          top: '52%',
          left: '5%',
          width: '400px',
          height: '340px'
        }}
        whileHover={{
          y: -15,
          scale: 1.05,
          transition: { duration: 0.6, ease: [0.23, 1, 0.320, 1] }
        }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setHoveredItem('notepad')}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onNavigate('projects')}
      >
        <Image
          src={notepad}
          alt="Kanban Board"
          fill
          className="object-contain transition-all duration-600"
          style={{
            filter: hoveredItem === 'notepad' 
              ? 'drop-shadow(0 20px 40px rgba(0,255,255,0.3)) brightness(105%)'
              : 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))'
          }}
          quality={100}
          unoptimized={true}
        />
        
        {hoveredItem === 'notepad' && (
          <div 
            className="fixed w-60 z-50"
            style={{
              top: '15%',
              left: '80%'
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl group"
              style={{ backdropFilter: 'blur(12px) saturate(180%)' }}
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 text-cyan-400">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-medium text-sm">Kanban Board</h3>
                </div>
                
                <p className="text-white/70 text-xs leading-relaxed mb-3">
                  Drag-and-drop task management with real-time collaboration
                </p>
                
                <div className="flex items-center gap-1 text-cyan-400 text-xs cursor-pointer group-hover:text-cyan-300 transition-colors">
                  <span className="relative">
                    Open Board
                    <div className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
                  </span>
                  <div className="w-3 h-3 transform group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>


      {/* Fade-out gradient at bottom for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none z-30" />
      
      {/* Team Members Popover */}
      {currentProject && (
        <TeamMembersPopover
          projectId={currentProject.id}
          isOpen={showTeamPopover}
          onClose={() => setShowTeamPopover(false)}
          position={teamPopoverPosition}
        />
      )}
      
    </div>
  );
}
