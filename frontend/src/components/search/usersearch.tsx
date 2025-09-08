'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, UserPlus, X, Crown, Shield, Eye, Zap } from 'lucide-react';
import { userAPI } from '@/lib/api';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  onInvite?: (user: User) => void;
  placeholder?: string;
  showInviteButtons?: boolean;
  excludeUserIds?: string[];
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return <Crown className="w-3 h-3 text-purple-400" />;
    case 'MANAGER': return <Shield className="w-3 h-3 text-red-400" />;
    case 'MEMBER': return <User className="w-3 h-3 text-green-400" />;
    default: return <User className="w-3 h-3 text-blue-400" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'MANAGER': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'MEMBER': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

export default function UserSearch({ 
  onUserSelect, 
  onInvite, 
  placeholder = "Search users...", 
  showInviteButtons = true,
  excludeUserIds = []
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setUsers([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const response = await userAPI.searchUsers(query.trim());
        const filteredUsers = response.users.filter(user => !excludeUserIds.includes(user.id));
        setUsers(filteredUsers);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, excludeUserIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || users.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < users.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleUserSelect(users[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setQuery('');
        searchRef.current?.blur();
        break;
    }
  };

  const handleUserSelect = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleInvite = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInvite) {
      onInvite(user);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
              setUsers([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/40 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto"
          >
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-slate-600/50 border-t-cyan-400 rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-400 text-sm">Searching...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-slate-400 text-sm">
                  {query.length < 2 ? 'Type at least 2 characters' : 'No users found'}
                </div>
              </div>
            ) : (
              <div className="py-2">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUserSelect(user)}
                    className={`px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 cursor-pointer transition-all ${
                      selectedIndex === index ? 'bg-slate-700/50 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-white font-medium text-sm shrink-0">
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

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-white text-sm truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="font-light capitalize">{user.role.toLowerCase()}</span>
                          </div>
                        </div>
                        <div className="text-slate-400 text-xs truncate">
                          @{user.username} • {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Invite Button */}
                    {showInviteButtons && onInvite && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleInvite(user, e)}
                        className="ml-3 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Search Tips */}
            {query.length >= 2 && users.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-600/30 bg-slate-900/50">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>↑↓ Navigate • Enter Select • Esc Close</span>
                  <span>{users.length} result{users.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}