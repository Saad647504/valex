'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Lock, Bell, Palette, Globe, Trash2, Upload, Camera, Save, X, Eye, EyeOff, Settings } from 'lucide-react';
import { Josefin_Sans } from 'next/font/google';
import { useAuth } from '@/contexts/authcontext';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { userAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/notificationcontext';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface UserSettingsProps {
  onBack?: () => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

export default function UserSettings({ onBack }: UserSettingsProps) {
  const { user, logout } = useAuth();
  const { error: notifyError, success: notifySuccess, info: notifyInfo } = useNotifications();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'danger'>('profile');
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        notifyError('File Too Large', 'Please select a file under 2MB', { variant: 'center', duration: 2500 });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        notifyError('Invalid File', 'Please select an image file', { variant: 'center', duration: 2500 });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        email: profileData.email,
        avatar: profileData.avatar
      });
      
      console.log('Profile updated successfully:', response);
      notifySuccess('Profile Updated', 'Your profile was saved.', { variant: 'center', duration: 2200 });
      
      // Force page reload to update navbar with new user info
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.body?.error || 'Failed to update profile. Please try again.';
      notifyError('Update Failed', errorMessage, { variant: 'center', duration: 2600 });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifyError('Passwords Do Not Match', 'Please confirm your new password', { variant: 'center', duration: 2600 });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      notifyError('Weak Password', 'Password must be at least 6 characters', { variant: 'center', duration: 2600 });
      return;
    }

    setLoading(true);
    try {
      await userAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('Password updated successfully');
      notifySuccess('Password Updated', 'Your password was changed.', { variant: 'center', duration: 2200 });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Failed to update password:', error);
      const errorMessage = error.body?.error || 'Failed to update password. Please try again.';
      notifyError('Update Failed', errorMessage, { variant: 'center', duration: 2600 });
    } finally {
      setLoading(false);
    }
  };

  const generateInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ];

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-light text-white mb-4">Access Denied</h1>
            <p className="text-slate-400 mb-6">Please sign in to access your settings.</p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      {/* Header */}
      <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <motion.button 
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-light group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                  <span>Back</span>
                </motion.button>
              )}
              
              <div className="h-6 w-px bg-slate-600/50" />
              
              <div>
                <h1 className="text-xl font-light text-white">Account Settings</h1>
                <p className="text-slate-400 text-sm">Manage your profile and preferences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg transition-all font-light"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all ${
                      activeTab === tab.id 
                        ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-light">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-light text-white mb-2">Profile Information</h2>
                        <p className="text-slate-400">Update your personal information and profile picture.</p>
                      </div>

                      {/* Avatar Section */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          {profileData.avatar ? (
                            <img 
                              src={profileData.avatar} 
                              alt="Profile" 
                              className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
                            />
                          ) : (
                            <div 
                              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-xl border-2 border-slate-600"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {generateInitials(profileData.firstName, profileData.lastName)}
                            </div>
                          )}
                          <button
                            onClick={handleAvatarUpload}
                            className="absolute -bottom-1 -right-1 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full transition-colors"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <button
                            onClick={handleAvatarUpload}
                            className="bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-lg transition-all font-light flex items-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Change Avatar</span>
                          </button>
                          <p className="text-slate-400 text-sm mt-2">JPG, PNG up to 2MB</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      {/* Avatar Colors */}
                      <div>
                        <label className="block text-sm font-light text-slate-300 mb-3">Avatar Color</label>
                        <div className="flex space-x-2">
                          {AVATAR_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setAvatarColor(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                avatarColor === color 
                                  ? 'border-white scale-110' 
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">Username</label>
                          <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleProfileSave}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center space-x-2"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-light text-white mb-2">Security Settings</h2>
                        <p className="text-slate-400">Manage your password and account security.</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 pr-12"
                              placeholder="Enter current password"
                            />
                            <button
                              onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">New Password</label>
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                            placeholder="Enter new password (min 6 characters)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-light text-slate-300 mb-2">Confirm New Password</label>
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handlePasswordSave}
                          disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center space-x-2"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          <span>Update Password</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-light text-white mb-2">Preferences</h2>
                        <p className="text-slate-400">Customize your experience and notifications.</p>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/40">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-slate-400" />
                            <div>
                              <h3 className="text-white font-light">Email Notifications</h3>
                              <p className="text-slate-400 text-sm">Receive email updates about your projects</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/40">
                          <div className="flex items-center space-x-3">
                            <Palette className="w-5 h-5 text-slate-400" />
                            <div>
                              <h3 className="text-white font-light">Dark Mode</h3>
                              <p className="text-slate-400 text-sm">Use dark theme (currently enabled)</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/40">
                          <div className="flex items-center space-x-3">
                            <Globe className="w-5 h-5 text-slate-400" />
                            <div>
                              <h3 className="text-white font-light">Language</h3>
                              <p className="text-slate-400 text-sm">Choose your preferred language</p>
                            </div>
                          </div>
                          <select className="bg-slate-700/50 border border-slate-600/40 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-cyan-400/60">
                            <option>English</option>
                            <option>French</option>
                            <option>Spanish</option>
                            <option>German</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'danger' && (
                  <motion.div
                    key="danger"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-light text-white mb-2">Danger Zone</h2>
                        <p className="text-slate-400">Irreversible actions that affect your account.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-6 border-2 border-red-600/30 bg-red-600/10 rounded-lg">
                          <div className="flex items-start space-x-4">
                            <Trash2 className="w-6 h-6 text-red-400 mt-1" />
                            <div className="flex-1">
                              <h3 className="text-red-400 font-light text-lg mb-2">Delete Account</h3>
                              <p className="text-slate-400 mb-4">
                                Once you delete your account, there is no going back. This will permanently delete your 
                                profile, projects, tasks, and all associated data.
                              </p>
                              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-light">
                                Delete My Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
